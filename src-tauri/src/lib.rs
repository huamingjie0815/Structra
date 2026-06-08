use std::{
    collections::HashMap,
    env,
    ffi::OsString,
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    sync::Mutex,
    thread,
    time::Duration,
};

use tauri::{
    menu::{Menu, MenuBuilder, MenuItem, MenuItemBuilder, MenuItemKind, SubmenuBuilder},
    AppHandle, Emitter, Manager, RunEvent, State,
};
#[cfg(any(target_os = "macos", target_os = "ios", target_os = "android"))]
use tauri::Url;

const TEXT_READ_EXTENSIONS: &[&str] = &["structra", "json", "mmd", "md", "txt"];
const TEXT_WRITE_EXTENSIONS: &[&str] = &["structra", "json", "svg", "mmd", "md", "txt"];
const BINARY_WRITE_EXTENSIONS: &[&str] = &["png", "pdf"];
const DOCUMENT_OPEN_EXTENSIONS: &[&str] = &["structra", "json"];
const AUTHORIZABLE_FILE_EXTENSIONS: &[&str] = &[
    "structra", "json", "mmd", "md", "txt", "svg", "png", "pdf",
];
const NATIVE_OPEN_DOCUMENTS_EVENT: &str = "native-open-documents";
const DESKTOP_LIFECYCLE_AUDIT_ENV: &str = "STRUCTRA_DESKTOP_LIFECYCLE_AUDIT_PATH";
const DESKTOP_MENU_AUDIT_COMMANDS_ENV: &str = "STRUCTRA_DESKTOP_MENU_AUDIT_COMMANDS";

#[derive(Default)]
struct PendingOpenDocuments(Mutex<Vec<String>>);

#[derive(Default)]
struct AuthorizedFilePaths(Mutex<Vec<String>>);

fn validate_local_file_path(
    path: &str,
    allowed_extensions: &[&str],
    action: &str,
) -> Result<(), String> {
    let candidate = Path::new(path);
    if !candidate.is_absolute() {
        return Err(format!("{action} requires an absolute local file path."));
    }

    let extension = candidate
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .unwrap_or_default();

    if allowed_extensions
        .iter()
        .any(|allowed| *allowed == extension)
    {
        return Ok(());
    }

    Err(format!(
        "{action} only supports local files with these extensions: {}.",
        allowed_extensions.join(", ")
    ))
}

fn normalize_document_open_path(path: &Path) -> Option<String> {
    let raw = path.to_string_lossy().to_string();
    validate_local_file_path(&raw, DOCUMENT_OPEN_EXTENSIONS, "Open").ok()?;
    Some(raw)
}

fn document_open_paths_from_args<I>(args: I) -> Vec<String>
where
    I: IntoIterator<Item = OsString>,
{
    args.into_iter()
        .skip(1)
        .filter_map(|arg| normalize_document_open_path(Path::new(&arg)))
        .collect()
}

#[cfg(any(target_os = "macos", target_os = "ios", target_os = "android"))]
fn document_open_paths_from_urls(urls: &[Url]) -> Vec<String> {
    urls.iter()
        .filter_map(|url| url.to_file_path().ok())
        .filter_map(|path| normalize_document_open_path(&path))
        .collect()
}

fn authorize_local_file_path(authorized: &AuthorizedFilePaths, path: &str) -> Result<(), String> {
    validate_local_file_path(path, AUTHORIZABLE_FILE_EXTENSIONS, "Authorize")?;
    let mut paths = authorized.0.lock().map_err(|error| error.to_string())?;
    if !paths.iter().any(|item| item == path) {
        paths.push(path.to_string());
    }
    Ok(())
}

fn authorize_local_file_paths(app: &AppHandle, paths: &[String]) {
    if let Some(authorized) = app.try_state::<AuthorizedFilePaths>() {
        for path in paths {
            let _ = authorize_local_file_path(&authorized, path);
        }
    }
}

fn ensure_authorized_file_path(
    authorized: &AuthorizedFilePaths,
    path: &str,
    action: &str,
) -> Result<(), String> {
    let paths = authorized.0.lock().map_err(|error| error.to_string())?;
    if paths.iter().any(|item| item == path) {
        return Ok(());
    }

    Err(format!(
        "{action} requires a path selected by the native dialog or opened by the OS."
    ))
}

fn push_pending_open_documents(app: &AppHandle, paths: Vec<String>) {
    if paths.is_empty() {
        return;
    }

    authorize_local_file_paths(app, &paths);

    if let Some(pending) = app.try_state::<PendingOpenDocuments>() {
        if let Ok(mut documents) = pending.0.lock() {
            for path in &paths {
                if !documents.contains(path) {
                    documents.push(path.clone());
                }
            }
        }
    }

    let _ = app.emit(NATIVE_OPEN_DOCUMENTS_EVENT, paths);
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_focus();
    }
}

fn native_menu_audit_commands_from_env_value(value: &str) -> Vec<String> {
    value
        .split(',')
        .map(str::trim)
        .filter(|command| !command.is_empty())
        .map(str::to_string)
        .collect()
}

fn schedule_native_menu_audit_commands(app: AppHandle) {
    if desktop_lifecycle_audit_path().is_none() {
        return;
    }

    let Some(raw_commands) = env::var(DESKTOP_MENU_AUDIT_COMMANDS_ENV).ok() else {
        return;
    };
    let commands = native_menu_audit_commands_from_env_value(&raw_commands);
    if commands.is_empty() {
        return;
    }

    thread::spawn(move || {
        thread::sleep(Duration::from_secs(1));
        for _ in 0..8 {
            for command in &commands {
                emit_native_menu_command(&app, command.clone(), "audit");
                thread::sleep(Duration::from_millis(300));
            }
            thread::sleep(Duration::from_millis(700));
        }
    });
}

fn emit_native_menu_command(app: &AppHandle, command: String, source: &str) {
    let _ = record_desktop_lifecycle_audit(
        "native-menu-event".to_string(),
        serde_json::json!({ "command": command, "source": source }),
    );

    if let Some(window) = app.get_webview_window("main") {
        if let Ok(command_json) = serde_json::to_string(&command) {
            let _ = window.eval(format!(
                "window.dispatchEvent(new CustomEvent('native-menu-command', {{ detail: {command_json} }}));"
            ));
        }
        let _ = window.emit("native-menu-command", command);
        return;
    }

    let _ = app.emit("native-menu-command", command);
}

#[tauri::command]
fn authorize_native_file_path(path: String, authorized: State<AuthorizedFilePaths>) -> Result<bool, String> {
    authorize_local_file_path(&authorized, &path)?;
    Ok(true)
}

fn read_text_file_authorized(path: String, authorized: &AuthorizedFilePaths) -> Result<String, String> {
    validate_local_file_path(&path, TEXT_READ_EXTENSIONS, "Read")?;
    ensure_authorized_file_path(authorized, &path, "Read")?;
    fs::read_to_string(path).map_err(|error| error.to_string())
}

fn write_text_file_authorized(
    path: String,
    contents: String,
    authorized: &AuthorizedFilePaths,
) -> Result<(), String> {
    validate_local_file_path(&path, TEXT_WRITE_EXTENSIONS, "Write")?;
    ensure_authorized_file_path(authorized, &path, "Write")?;
    fs::write(path, contents).map_err(|error| error.to_string())
}

fn write_binary_file_authorized(
    path: String,
    contents: Vec<u8>,
    authorized: &AuthorizedFilePaths,
) -> Result<(), String> {
    validate_local_file_path(&path, BINARY_WRITE_EXTENSIONS, "Write")?;
    ensure_authorized_file_path(authorized, &path, "Write")?;
    fs::write(path, contents).map_err(|error| error.to_string())
}

#[tauri::command]
fn read_text_file(path: String, authorized: State<AuthorizedFilePaths>) -> Result<String, String> {
    read_text_file_authorized(path, &authorized)
}

#[tauri::command]
fn write_text_file(
    path: String,
    contents: String,
    authorized: State<AuthorizedFilePaths>,
) -> Result<(), String> {
    write_text_file_authorized(path, contents, &authorized)
}

#[tauri::command]
fn write_binary_file(
    path: String,
    contents: Vec<u8>,
    authorized: State<AuthorizedFilePaths>,
) -> Result<(), String> {
    write_binary_file_authorized(path, contents, &authorized)
}

fn desktop_lifecycle_audit_path() -> Option<PathBuf> {
    let path = PathBuf::from(env::var_os(DESKTOP_LIFECYCLE_AUDIT_ENV)?);
    if !path.is_absolute() {
        return None;
    }

    let temp_dir = env::temp_dir();
    if path.starts_with(&temp_dir) || path.starts_with("/tmp") || path.starts_with("/private/tmp") {
        return Some(path);
    }

    None
}

#[tauri::command]
fn record_desktop_lifecycle_audit(
    event: String,
    payload: serde_json::Value,
) -> Result<bool, String> {
    let Some(audit_path) = desktop_lifecycle_audit_path() else {
        return Ok(false);
    };

    if let Some(parent) = audit_path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let record = serde_json::json!({
        "event": event,
        "payload": payload
    });
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(audit_path)
        .map_err(|error| error.to_string())?;
    writeln!(file, "{record}").map_err(|error| error.to_string())?;
    Ok(true)
}

fn set_menu_item_kind_enabled(item: &MenuItemKind<tauri::Wry>, enabled: bool) -> tauri::Result<()> {
    match item {
        MenuItemKind::MenuItem(item) => item.set_enabled(enabled),
        MenuItemKind::Check(item) => item.set_enabled(enabled),
        MenuItemKind::Icon(item) => item.set_enabled(enabled),
        MenuItemKind::Submenu(item) => item.set_enabled(enabled),
        MenuItemKind::Predefined(_) => Ok(()),
    }
}

fn set_menu_items_enabled_by_id(
    items: Vec<MenuItemKind<tauri::Wry>>,
    id: &str,
    enabled: bool,
) -> tauri::Result<bool> {
    let mut matched = false;

    for item in items {
        if item.id().as_ref() == id {
            set_menu_item_kind_enabled(&item, enabled)?;
            matched = true;
        }

        if let MenuItemKind::Submenu(submenu) = item {
            if set_menu_items_enabled_by_id(submenu.items()?, id, enabled)? {
                matched = true;
            }
        }
    }

    Ok(matched)
}

#[tauri::command]
fn set_native_menu_enabled_state(
    states: HashMap<String, bool>,
    app: AppHandle,
) -> Result<(), String> {
    let Some(menu) = app.menu() else {
        return Ok(());
    };

    for (id, enabled) in &states {
        set_menu_items_enabled_by_id(
            menu.items().map_err(|error| error.to_string())?,
            id,
            *enabled,
        )
        .map_err(|error| error.to_string())?;
    }

    let _ = record_desktop_lifecycle_audit(
        "native-menu-state".to_string(),
        serde_json::json!({ "states": states }),
    );
    schedule_native_menu_audit_commands(app);

    Ok(())
}

#[tauri::command]
fn drain_pending_open_document_paths(pending: State<PendingOpenDocuments>) -> Vec<String> {
    pending
        .0
        .lock()
        .map(|mut documents| documents.drain(..).collect())
        .unwrap_or_default()
}

fn menu_item(
    app: &tauri::AppHandle,
    id: &str,
    text: &str,
    accelerator: Option<&str>,
) -> tauri::Result<MenuItem<tauri::Wry>> {
    let mut builder = MenuItemBuilder::with_id(id, text);
    if let Some(accelerator) = accelerator {
        builder = builder.accelerator(accelerator);
    }
    builder.build(app)
}

fn build_app_menu(app: &tauri::AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let app_menu = SubmenuBuilder::new(app, "Structra")
        .item(&menu_item(
            app,
            "command-palette",
            "命令面板",
            Some("CmdOrCtrl+K"),
        )?)
        .item(&menu_item(
            app,
            "preferences",
            "偏好设置",
            Some("CmdOrCtrl+,"),
        )?)
        .separator()
        .about(None)
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let file_menu = SubmenuBuilder::new(app, "文件")
        .item(&menu_item(
            app,
            "document-new",
            "新建文档",
            Some("CmdOrCtrl+N"),
        )?)
        .item(&menu_item(
            app,
            "document-open",
            "打开文档",
            Some("CmdOrCtrl+O"),
        )?)
        .item(&menu_item(app, "open-workspace", "打开本地工作台", None)?)
        .item(&menu_item(
            app,
            "document-save",
            "保存文档",
            Some("CmdOrCtrl+S"),
        )?)
        .item(&menu_item(
            app,
            "document-save-as",
            "另存为文档",
            Some("CmdOrCtrl+Shift+S"),
        )?)
        .separator()
        .item(&menu_item(app, "page-new", "新建页面", None)?)
        .item(&menu_item(app, "page-copy", "复制当前页面", None)?)
        .item(&menu_item(app, "save-cache", "保存到本机缓存", None)?)
        .item(&menu_item(app, "save-version", "保存版本", None)?)
        .separator()
        .item(&menu_item(app, "import-json", "导入 JSON", None)?)
        .item(&menu_item(app, "import-mermaid", "导入 Mermaid", None)?)
        .separator()
        .item(&menu_item(app, "export-json", "导出文档 JSON", None)?)
        .item(&menu_item(app, "export-svg", "导出当前页 SVG", None)?)
        .item(&menu_item(app, "export-png", "导出当前页 PNG", None)?)
        .item(&menu_item(app, "export-pdf", "导出当前页 PDF", None)?)
        .item(&menu_item(
            app,
            "export-document-pdf",
            "导出文档 PDF",
            None,
        )?)
        .separator()
        .item(&menu_item(
            app,
            "print-current-page",
            "打印当前页",
            Some("CmdOrCtrl+P"),
        )?)
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "编辑")
        .item(&menu_item(app, "undo", "撤销", Some("CmdOrCtrl+Z"))?)
        .item(&menu_item(app, "redo", "重做", Some("CmdOrCtrl+Shift+Z"))?)
        .separator()
        .item(&menu_item(
            app,
            "copy-selection",
            "复制",
            Some("CmdOrCtrl+C"),
        )?)
        .item(&menu_item(
            app,
            "cut-selection",
            "剪切",
            Some("CmdOrCtrl+X"),
        )?)
        .item(&menu_item(
            app,
            "paste-selection",
            "粘贴",
            Some("CmdOrCtrl+V"),
        )?)
        .item(&menu_item(
            app,
            "duplicate-selection",
            "快速复制",
            Some("CmdOrCtrl+D"),
        )?)
        .separator()
        .item(&menu_item(
            app,
            "select-all",
            "全选节点",
            Some("CmdOrCtrl+A"),
        )?)
        .item(&menu_item(app, "delete-selection", "删除", None)?)
        .build()?;

    let view_menu = SubmenuBuilder::new(app, "视图")
        .item(&menu_item(app, "tool-select", "选择工具", Some("V"))?)
        .item(&menu_item(app, "tool-pan", "平移工具", Some("H"))?)
        .item(&menu_item(app, "tool-connect", "连线工具", Some("C"))?)
        .separator()
        .item(&menu_item(app, "toggle-grid", "显示/隐藏网格", None)?)
        .item(&menu_item(app, "toggle-rulers", "显示/隐藏标尺", None)?)
        .item(&menu_item(
            app,
            "toggle-snap-to-grid",
            "开启/关闭吸附网格",
            None,
        )?)
        .separator()
        .item(&menu_item(app, "zoom-in", "放大", Some("CmdOrCtrl+="))?)
        .item(&menu_item(app, "zoom-out", "缩小", Some("CmdOrCtrl+-"))?)
        .item(&menu_item(
            app,
            "reset-zoom",
            "实际大小",
            Some("CmdOrCtrl+1"),
        )?)
        .item(&menu_item(
            app,
            "fit-canvas",
            "适应画布",
            Some("CmdOrCtrl+0"),
        )?)
        .item(&menu_item(app, "fit-selection", "适应选中", None)?)
        .separator()
        .item(&menu_item(app, "toggle-preview", "预览模式", None)?)
        .item(&menu_item(app, "presentation", "演示模式", None)?)
        .build()?;

    let help_menu = SubmenuBuilder::new(app, "帮助")
        .item(&menu_item(
            app,
            "command-palette",
            "打开命令面板",
            Some("CmdOrCtrl+K"),
        )?)
        .build()?;

    MenuBuilder::new(app)
        .item(&app_menu)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&help_menu)
        .build()
}

#[cfg(any(target_os = "macos", target_os = "ios", target_os = "android"))]
fn handle_run_event(app: &AppHandle, event: RunEvent) {
    if let RunEvent::Opened { urls } = event {
        push_pending_open_documents(app, document_open_paths_from_urls(&urls));
    }
}

#[cfg(not(any(target_os = "macos", target_os = "ios", target_os = "android")))]
fn handle_run_event(_app: &AppHandle, _event: RunEvent) {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_open_document_paths = document_open_paths_from_args(std::env::args_os());

    tauri::Builder::default()
        .manage(PendingOpenDocuments::default())
        .manage(AuthorizedFilePaths::default())
        .menu(build_app_menu)
        .on_menu_event(|app, event| {
            let command = event.id().as_ref().to_string();
            if !command.is_empty() {
                emit_native_menu_command(app, command, "menu");
            }
        })
        .setup(move |app| {
            push_pending_open_documents(app.handle(), initial_open_document_paths.clone());
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            authorize_native_file_path,
            read_text_file,
            write_text_file,
            write_binary_file,
            set_native_menu_enabled_state,
            drain_pending_open_document_paths,
            record_desktop_lifecycle_audit
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            handle_run_event(app, event);
        });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn local_file_path_validation_requires_absolute_supported_paths() {
        assert!(
            validate_local_file_path("/tmp/order.structra", TEXT_READ_EXTENSIONS, "Read").is_ok()
        );
        assert!(validate_local_file_path("/tmp/order.structra", TEXT_READ_EXTENSIONS, "Read").is_ok());
        assert!(validate_local_file_path("/tmp/order.JSON", TEXT_READ_EXTENSIONS, "Read").is_ok());
        assert!(validate_local_file_path("/tmp/save.structra", TEXT_WRITE_EXTENSIONS, "Write").is_ok());
        assert!(
            validate_local_file_path("/tmp/export.svg", TEXT_WRITE_EXTENSIONS, "Write").is_ok()
        );
        assert!(
            validate_local_file_path("/tmp/export.pdf", BINARY_WRITE_EXTENSIONS, "Write").is_ok()
        );

        assert!(
            validate_local_file_path("relative/order.structra", TEXT_READ_EXTENSIONS, "Read")
                .is_err()
        );
        assert!(validate_local_file_path("/tmp/secret.env", TEXT_READ_EXTENSIONS, "Read").is_err());
        assert!(
            validate_local_file_path("/tmp/export.svg", BINARY_WRITE_EXTENSIONS, "Write").is_err()
        );
        assert!(
            validate_local_file_path("/tmp/export.pdf", TEXT_WRITE_EXTENSIONS, "Write").is_err()
        );
    }

    #[test]
    fn native_document_open_paths_accept_only_absolute_document_files() {
        let args = vec![
            OsString::from("/Applications/Structra.app/Contents/MacOS/structra"),
            OsString::from("/tmp/order.structra"),
            OsString::from("/tmp/review.structra"),
            OsString::from("/tmp/legacy.json"),
            OsString::from("/tmp/notes.txt"),
            OsString::from("relative/order.structra"),
        ];

        assert_eq!(
            document_open_paths_from_args(args),
            vec!["/tmp/order.structra", "/tmp/review.structra", "/tmp/legacy.json"]
        );
    }

    #[test]
    #[cfg(any(target_os = "macos", target_os = "ios", target_os = "android"))]
    fn native_document_open_paths_convert_file_urls() {
        let valid = Url::from_file_path("/tmp/order.structra").expect("file URL should build");
        let unsupported = Url::from_file_path("/tmp/notes.txt").expect("file URL should build");
        let remote =
            Url::parse("https://example.com/order.structra").expect("remote URL should parse");

        assert_eq!(
            document_open_paths_from_urls(&[valid, unsupported, remote]),
            vec!["/tmp/order.structra"]
        );
    }

    #[test]
    fn native_menu_audit_commands_ignore_empty_entries() {
        assert_eq!(
            native_menu_audit_commands_from_env_value(" document-save, preferences, ,toggle-grid "),
            vec!["document-save", "preferences", "toggle-grid"]
        );
        assert!(native_menu_audit_commands_from_env_value(" , ").is_empty());
    }

    #[test]
    fn desktop_lifecycle_audit_only_writes_to_explicit_temp_path() {
        env::remove_var(DESKTOP_LIFECYCLE_AUDIT_ENV);
        assert_eq!(
            record_desktop_lifecycle_audit(
                "open-document".to_string(),
                serde_json::json!({ "path": "/tmp/order.structra" })
            ),
            Ok(false)
        );

        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be after unix epoch")
            .as_nanos();
        let audit_path = env::temp_dir().join(format!("structra-open-audit-{stamp}.jsonl"));
        env::set_var(DESKTOP_LIFECYCLE_AUDIT_ENV, &audit_path);

        assert_eq!(
            record_desktop_lifecycle_audit(
                "open-document".to_string(),
                serde_json::json!({
                    "path": "/tmp/order.structra",
                    "documentName": "order.structra",
                    "source": "test"
                })
            ),
            Ok(true)
        );
        let audit =
            fs::read_to_string(&audit_path).expect("desktop lifecycle audit should be written");
        assert!(audit.contains(r#""event":"open-document""#));
        assert!(audit.contains(r#""path":"/tmp/order.structra""#));
        assert!(audit.contains(r#""documentName":"order.structra""#));

        env::remove_var(DESKTOP_LIFECYCLE_AUDIT_ENV);
        fs::remove_file(audit_path).expect("desktop lifecycle audit fixture should be removed");
    }

    #[test]
    fn native_file_commands_roundtrip_supported_local_files() {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be after unix epoch")
            .as_nanos();
        let base = std::env::temp_dir().join(format!("structra-native-file-test-{stamp}"));
        fs::create_dir_all(&base).expect("test temp dir should be created");
        let authorized = AuthorizedFilePaths::default();

        let document_path = base.join("diagram.structra");
        let document_path_text = document_path.to_string_lossy().to_string();
        let document_contents = r#"{"schema":"structra.diagram-document","version":1,"document":{"pages":[{"id":"p","name":"P","nodes":[],"edges":[]}],"activePageId":"p"}}"#;
        assert!(
            write_text_file_authorized(
                document_path_text.clone(),
                document_contents.to_string(),
                &authorized
            )
            .is_err(),
            "untrusted document writes must require prior authorization"
        );
        authorize_local_file_path(&authorized, &document_path_text)
            .expect("structra document path should authorize");
        write_text_file_authorized(
            document_path_text.clone(),
            document_contents.to_string(),
            &authorized,
        )
        .expect("structra document should write");
        let read_back =
            read_text_file_authorized(document_path_text, &authorized).expect("structra document should read");
        assert_eq!(read_back, document_contents);

        let png_path = base.join("diagram.png");
        let png_path_text = png_path.to_string_lossy().to_string();
        authorize_local_file_path(&authorized, &png_path_text)
            .expect("png export path should authorize");
        write_binary_file_authorized(png_path_text, vec![137, 80, 78, 71], &authorized)
        .expect("png export should write");
        assert_eq!(
            fs::read(png_path).expect("png export should exist"),
            vec![137, 80, 78, 71]
        );

        fs::remove_dir_all(base).expect("test temp dir should be removed");
    }
}
