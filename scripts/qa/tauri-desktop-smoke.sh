#!/usr/bin/env bash
set -euo pipefail

APP_PATH="${1:-src-tauri/target/release/bundle/macos/Structra.app}"
APP_NAME="${STRUCTRA_DESKTOP_APP_NAME:-Structra}"
AX_PROCESS_NAME="${STRUCTRA_DESKTOP_AX_PROCESS_NAME:-structra}"
TIMEOUT_SECONDS="${STRUCTRA_DESKTOP_SMOKE_TIMEOUT_SECONDS:-25}"
PLIST_PATH="$APP_PATH/Contents/Info.plist"
OPEN_FIXTURE_PATH="${STRUCTRA_DESKTOP_OPEN_FIXTURE:-tests/fixtures/smoke-import-document.structra}"
SECOND_OPEN_FIXTURE_PATH="${STRUCTRA_DESKTOP_SECOND_OPEN_FIXTURE:-tests/fixtures/smoke-import-legacy.structra}"
REQUIRED_DOCUMENT_EXTENSIONS=("structra")
DESKTOP_LIFECYCLE_AUDIT_ENV="STRUCTRA_DESKTOP_LIFECYCLE_AUDIT_PATH"
DESKTOP_MENU_AUDIT_COMMANDS_ENV="STRUCTRA_DESKTOP_MENU_AUDIT_COMMANDS"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
SMOKE_FIXTURE_DIR=""

if [[ ! -d "$APP_PATH" ]]; then
  echo "Desktop smoke app bundle not found: $APP_PATH" >&2
  echo "Run pnpm tauri:build first, then rerun this script." >&2
  exit 1
fi

fail_document_types_check() {
  echo "Desktop smoke document type check failed: $1" >&2
  echo "Info.plist: $PLIST_PATH" >&2
  exit 1
}

document_type_evidence_has_extension() {
  local evidence="$1"
  local extension="$2"

  printf '%s\n' "$evidence" | grep -Eiq "(^|[^[:alnum:]_])${extension}([^[:alnum:]_]|$)"
}

collect_document_type_evidence_with_plistbuddy() {
  local plist_path="$1"
  local index=0
  local extensions

  if ! /usr/libexec/PlistBuddy -c "Print :CFBundleDocumentTypes" "$plist_path" >/dev/null 2>&1; then
    return 1
  fi

  while /usr/libexec/PlistBuddy -c "Print :CFBundleDocumentTypes:$index" "$plist_path" >/dev/null 2>&1; do
    extensions="$(/usr/libexec/PlistBuddy -c "Print :CFBundleDocumentTypes:$index:CFBundleTypeExtensions" "$plist_path" 2>/dev/null || true)"
    printf '%s\n' "$extensions"
    index=$((index + 1))
  done
}

collect_document_type_evidence_with_plutil() {
  local plist_path="$1"

  if ! plutil -p "$plist_path" 2>/dev/null | grep -A 80 '"CFBundleDocumentTypes"'; then
    return 1
  fi
}

verify_document_types() {
  local evidence
  local extension
  local inspector

  if [[ ! -f "$PLIST_PATH" ]]; then
    echo "Desktop smoke skipped document type check: Info.plist not found at $PLIST_PATH"
    return 0
  fi

  if [[ -x /usr/libexec/PlistBuddy ]]; then
    inspector="/usr/libexec/PlistBuddy"
    evidence="$(collect_document_type_evidence_with_plistbuddy "$PLIST_PATH")" || fail_document_types_check "CFBundleDocumentTypes is missing or unreadable"
  elif command -v plutil >/dev/null 2>&1; then
    inspector="plutil"
    evidence="$(collect_document_type_evidence_with_plutil "$PLIST_PATH")" || fail_document_types_check "CFBundleDocumentTypes is missing or unreadable"
  else
    fail_document_types_check "neither /usr/libexec/PlistBuddy nor plutil is available"
  fi

  for extension in "${REQUIRED_DOCUMENT_EXTENSIONS[@]}"; do
    if ! document_type_evidence_has_extension "$evidence" "$extension"; then
      fail_document_types_check "CFBundleDocumentTypes does not cover .$extension"
    fi
  done

  echo "Desktop smoke document types verified with $inspector: .structra, .structra"
}

verify_document_types

absolute_path() {
  local path="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath "$path"
    return
  fi
  if [[ "$path" = /* ]]; then
    printf '%s\n' "$path"
    return
  fi

  printf '%s/%s\n' "$(cd -P "$(dirname "$path")" && pwd -P)" "$(basename "$path")"
}

prepare_open_fixture() {
  local source_path="$1"
  local fixture_stem="$2"
  local extension
  local target_path

  if [[ ! -f "$source_path" ]]; then
    echo "Desktop smoke document-open fixture not found: $source_path" >&2
    exit 1
  fi

  if [[ -z "$SMOKE_FIXTURE_DIR" ]]; then
    SMOKE_FIXTURE_DIR="$(mktemp -d -t structra-desktop-fixtures.XXXXXX)"
  fi

  extension="${source_path##*.}"
  target_path="$SMOKE_FIXTURE_DIR/$fixture_stem.$extension"
  cp "$source_path" "$target_path"
  printf '%s\n' "$target_path"
}

register_app_bundle() {
  if [[ -x "$LSREGISTER" ]]; then
    "$LSREGISTER" -f "$(absolute_path "$APP_PATH")" >/dev/null 2>&1 || true
  fi
}

is_running() {
  osascript -e "application \"$APP_NAME\" is running" 2>/dev/null | tr -d '\r'
}

front_window_title() {
  osascript -e "tell application \"$APP_NAME\" to if (count of windows) > 0 then get name of front window" 2>/dev/null | tr -d '\r' || true
}

quit_app() {
  osascript -e "tell application \"$APP_NAME\" to quit" >/dev/null 2>&1 || true
}

cleanup() {
  quit_app
  launchctl unsetenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" >/dev/null 2>&1 || true
  launchctl unsetenv "$DESKTOP_MENU_AUDIT_COMMANDS_ENV" >/dev/null 2>&1 || true
  if [[ -n "${OPEN_PID:-}" ]]; then
    wait "$OPEN_PID" >/dev/null 2>&1 || true
  fi
}

stop_existing_app() {
  if [[ "$(is_running)" == "true" ]]; then
    quit_app
    wait_for_exit "stop existing app"
  fi
}

wait_for_launch() {
  local label="$1"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    if [[ "$(is_running)" == "true" ]]; then
      echo "Desktop smoke launched: $APP_NAME ($label)"
      return 0
    fi
    sleep 1
  done

  echo "Desktop smoke timed out waiting for app launch: $APP_NAME ($label)" >&2
  return 1
}

wait_for_exit() {
  local label="$1"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    if [[ "$(is_running)" != "true" ]]; then
      return 0
    fi
    sleep 1
  done

  echo "Desktop smoke timed out waiting for app exit: $APP_NAME ($label)" >&2
  return 1
}

wait_for_window_title() {
  local expected="$1"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))
  local title

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    title="$(front_window_title)"
    if [[ "$title" == *"$expected"* ]]; then
      echo "Desktop smoke opened document: $title"
      return 0
    fi
    sleep 1
  done

  echo "Desktop smoke timed out waiting for window title containing: $expected" >&2
  echo "Current window title: $(front_window_title)" >&2
  return 1
}

wait_for_desktop_lifecycle_audit() {
  local audit_path="$1"
  local expected_event="$2"
  local expected_path="$3"
  local expected_name="$4"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))
  local match

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    if [[ -f "$audit_path" ]]; then
      match="$(grep -F "\"event\":\"$expected_event\"" "$audit_path" | grep -F "$expected_path" | grep -F "$expected_name" | tail -n 1 || true)"
      if [[ -n "$match" ]]; then
        echo "Desktop smoke lifecycle audit ($expected_event): $match"
        return 0
      fi
    fi
    if [[ "$(is_running)" != "true" ]]; then
      echo "Desktop smoke app exited before $expected_event audit was written." >&2
      return 1
    fi
    sleep 1
  done

  echo "Desktop smoke timed out waiting for $expected_event audit: $expected_name" >&2
  if [[ -f "$audit_path" ]]; then
    echo "Desktop lifecycle audit contents:" >&2
    cat "$audit_path" >&2
  fi
  return 1
}

wait_for_workspace_recent_open_audit() {
  local audit_path="$1"
  local expected_event="$2"
  local expected_path="$3"
  local expected_opened="${4:-}"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))
  local match

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    if [[ -f "$audit_path" ]]; then
      match="$(grep -F "\"event\":\"$expected_event\"" "$audit_path" | grep -F "$expected_path" || true)"
      if [[ -n "$expected_opened" ]]; then
        match="$(printf '%s\n' "$match" | grep -F "\"opened\":$expected_opened" | tail -n 1 || true)"
      else
        match="$(printf '%s\n' "$match" | tail -n 1 || true)"
      fi
      if [[ -n "$match" ]]; then
        echo "Desktop smoke workspace recent audit ($expected_event): $match"
        return 0
      fi
    fi
    if [[ "$(is_running)" != "true" ]]; then
      echo "Desktop smoke app exited before $expected_event audit was written." >&2
      return 1
    fi
    sleep 1
  done

  echo "Desktop smoke timed out waiting for workspace recent audit: $expected_event $expected_path" >&2
  if [[ -f "$audit_path" ]]; then
    echo "Desktop lifecycle audit contents:" >&2
    cat "$audit_path" >&2
  fi
  return 1
}

wait_for_unsaved_discard_prompt_audit() {
  local audit_path="$1"
  local expected_action="$2"
  local expected_allowed="$3"
  local expected_source="$4"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))
  local match

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    if [[ -f "$audit_path" ]]; then
      match="$(grep -F '"event":"unsaved-discard-prompt"' "$audit_path" | grep -F "\"action\":\"$expected_action\"" | grep -F "\"allowed\":$expected_allowed" | grep -F "\"source\":\"$expected_source\"" | tail -n 1 || true)"
      if [[ -n "$match" ]]; then
        echo "Desktop smoke unsaved discard prompt audit: $match"
        return 0
      fi
    fi
    if [[ "$(is_running)" != "true" ]]; then
      echo "Desktop smoke app exited before unsaved prompt audit was written." >&2
      return 1
    fi
    sleep 1
  done

  echo "Desktop smoke timed out waiting for unsaved prompt audit: $expected_action" >&2
  if [[ -f "$audit_path" ]]; then
    echo "Desktop lifecycle audit contents:" >&2
    cat "$audit_path" >&2
  fi
  return 1
}

wait_for_native_menu_state() {
  local audit_path="$1"
  local command_id="$2"
  local expected_enabled="$3"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))
  local match

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    if [[ -f "$audit_path" ]]; then
      match="$(grep -F '"event":"native-menu-state"' "$audit_path" | grep -F "\"$command_id\":$expected_enabled" | tail -n 1 || true)"
      if [[ -n "$match" ]]; then
        echo "Desktop smoke native menu state ($command_id=$expected_enabled): $match"
        return 0
      fi
    fi
    if [[ "$(is_running)" != "true" ]]; then
      echo "Desktop smoke app exited before native menu state audit was written." >&2
      return 1
    fi
    sleep 1
  done

  echo "Desktop smoke timed out waiting for native menu state: $command_id=$expected_enabled" >&2
  if [[ -f "$audit_path" ]]; then
    echo "Desktop lifecycle audit contents:" >&2
    cat "$audit_path" >&2
  fi
  return 1
}

wait_for_native_menu_command() {
  local audit_path="$1"
  local command_id="$2"
  local expected_handled="$3"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))
  local match

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    if [[ -f "$audit_path" ]]; then
      match="$(grep -F '"event":"native-menu-command"' "$audit_path" | grep -F "\"command\":\"$command_id\"" | grep -F "\"handled\":$expected_handled" | tail -n 1 || true)"
      if [[ -n "$match" ]]; then
        echo "Desktop smoke native menu command ($command_id handled=$expected_handled): $match"
        return 0
      fi
    fi
    if [[ "$(is_running)" != "true" ]]; then
      echo "Desktop smoke app exited before native menu command audit was written." >&2
      return 1
    fi
    sleep 1
  done

  echo "Desktop smoke timed out waiting for native menu command: $command_id handled=$expected_handled" >&2
  if [[ -f "$audit_path" ]]; then
    echo "Desktop lifecycle audit contents:" >&2
    cat "$audit_path" >&2
  fi
  return 1
}

wait_for_native_menu_event() {
  local audit_path="$1"
  local command_id="$2"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))
  local match

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    if [[ -f "$audit_path" ]]; then
      match="$(grep -F '"event":"native-menu-event"' "$audit_path" | grep -F "\"command\":\"$command_id\"" | tail -n 1 || true)"
      if [[ -n "$match" ]]; then
        echo "Desktop smoke native menu event ($command_id): $match"
        return 0
      fi
    fi
    if [[ "$(is_running)" != "true" ]]; then
      echo "Desktop smoke app exited before native menu event was written." >&2
      return 1
    fi
    sleep 1
  done

  echo "Desktop smoke timed out waiting for native menu event: $command_id" >&2
  if [[ -f "$audit_path" ]]; then
    echo "Desktop lifecycle audit contents:" >&2
    cat "$audit_path" >&2
  fi
  return 1
}

click_native_menu_item() {
  local menu_name="$1"
  local item_name="$2"

  osascript -e "tell application \"System Events\" to tell process \"$AX_PROCESS_NAME\" to click menu item \"$item_name\" of menu \"$menu_name\" of menu bar 1" >/dev/null
}

drive_open_panel_to_path() {
  local target_path="$1"

  osascript - "$AX_PROCESS_NAME" "$target_path" <<'APPLESCRIPT' >/dev/null
on run argv
  set appName to item 1 of argv
  set targetPath to item 2 of argv
  tell application "System Events"
    tell process appName
      set frontmost to true
    end tell
    repeat 30 times
      tell process appName
        if (exists sheet 1 of window 1) then exit repeat
        if ((count of windows) > 1) then exit repeat
      end tell
      delay 0.2
    end repeat
    tell process appName
      set frontmost to true
      delay 0.5
      keystroke "g" using {command down, shift down}
      repeat 30 times
        if (exists sheet 1 of sheet 1 of window 1) then exit repeat
        delay 0.2
      end repeat
      set value of text field 1 of sheet 1 of sheet 1 of window 1 to targetPath
      delay 0.2
      key code 36
      repeat 30 times
        if not (exists sheet 1 of sheet 1 of window 1) then exit repeat
        delay 0.2
      end repeat
      repeat 30 times
        if (enabled of button "Open" of sheet 1 of window 1) then exit repeat
        delay 0.2
      end repeat
      click button "Open" of sheet 1 of window 1
    end tell
  end tell
end run
APPLESCRIPT
}

drive_save_panel_to_directory() {
  local target_dir="$1"

  osascript - "$AX_PROCESS_NAME" "$target_dir" <<'APPLESCRIPT' >/dev/null
on run argv
  set appName to item 1 of argv
  set targetDir to item 2 of argv
  tell application "System Events"
    repeat 30 times
      tell process appName
        if (exists sheet 1 of window 1) then exit repeat
      end tell
      delay 0.2
    end repeat
    tell process appName
      set frontmost to true
      delay 0.5
      keystroke "g" using {command down, shift down}
      repeat 30 times
        if (exists sheet 1 of sheet 1 of window 1) then exit repeat
        delay 0.2
      end repeat
      set value of text field 1 of sheet 1 of sheet 1 of window 1 to targetDir
      delay 0.2
      key code 36
      repeat 30 times
        if not (exists sheet 1 of sheet 1 of window 1) then exit repeat
        delay 0.2
      end repeat
      repeat 30 times
        if (exists button "Save" of sheet 1 of window 1) then
          if (enabled of button "Save" of sheet 1 of window 1) then exit repeat
        else if (exists button "保存" of sheet 1 of window 1) then
          if (enabled of button "保存" of sheet 1 of window 1) then exit repeat
        end if
        delay 0.2
      end repeat
      if (exists button "Save" of sheet 1 of window 1) then
        click button "Save" of sheet 1 of window 1
      else
        click button "保存" of sheet 1 of window 1
      end if
    end tell
  end tell
end run
APPLESCRIPT
}

assert_recent_audit_order() {
  local audit_path="$1"
  local expected_first_path="$2"
  local expected_second_path="$3"

  node - "$audit_path" "$expected_first_path" "$expected_second_path" <<'NODE'
const fs = require("node:fs");
const [auditPath, expectedFirstPath, expectedSecondPath] = process.argv.slice(2);
const lines = fs.readFileSync(auditPath, "utf8").trim().split(/\n+/).filter(Boolean);
const recentRecords = lines
  .map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  })
  .filter((record) => record?.event === "recent-documents");
const latest = recentRecords.at(-1);
const documents = latest?.payload?.recentDocuments ?? [];
if (!latest || !Array.isArray(documents)) {
  throw new Error("No recent-documents audit record found.");
}
if (documents[0]?.path !== expectedFirstPath) {
  throw new Error(`Recent first item mismatch: expected ${expectedFirstPath}, got ${documents[0]?.path ?? "<missing>"}`);
}
if (!documents.some((item) => item.path === expectedSecondPath)) {
  throw new Error(`Recent list did not preserve ${expectedSecondPath}`);
}
console.log(`Desktop smoke recent order verified: ${documents[0].name} first, ${documents.length} total`);
NODE
}

assert_latest_native_menu_state() {
  local audit_path="$1"
  local command_id="$2"
  local expected_enabled="$3"

  node - "$audit_path" "$command_id" "$expected_enabled" <<'NODE'
const fs = require("node:fs");
const [auditPath, commandId, expectedEnabledRaw] = process.argv.slice(2);
const expectedEnabled = expectedEnabledRaw === "true";
const records = fs.readFileSync(auditPath, "utf8").trim().split(/\n+/).filter(Boolean)
  .map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  })
  .filter((record) => record?.event === "native-menu-state");
const latest = records.at(-1);
if (!latest) {
  throw new Error("No native-menu-state audit record found.");
}
const actual = latest.payload?.states?.[commandId];
if (actual !== expectedEnabled) {
  throw new Error(`Latest native menu state mismatch for ${commandId}: expected ${expectedEnabled}, got ${actual}`);
}
console.log(`Desktop smoke latest native menu state verified: ${commandId}=${actual}`);
NODE
}

assert_file_exists() {
  local path="$1"
  local label="$2"

  if [[ ! -f "$path" ]]; then
    echo "Desktop smoke expected $label file was not written: $path" >&2
    exit 1
  fi
  echo "Desktop smoke $label file exists: $path"
}

assert_json_file() {
  local path="$1"

  node - "$path" <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];
const parsed = JSON.parse(fs.readFileSync(path, "utf8"));
if (!parsed || typeof parsed !== "object") {
  throw new Error(`Exported JSON did not parse as an object: ${path}`);
}
console.log(`Desktop smoke JSON export parsed: ${path}`);
NODE
}

active_page_name_for_fixture() {
  local path="$1"

  node - "$path" <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];
const parsed = JSON.parse(fs.readFileSync(path, "utf8"));
const document = parsed?.document ?? parsed;
const pages = Array.isArray(document?.pages) ? document.pages : [];
const activePage = pages.find((page) => page.id === document?.activePageId) ?? pages[0];
const pageName = typeof activePage?.name === "string" && activePage.name.trim() ? activePage.name.trim() : "diagram";
process.stdout.write(pageName);
NODE
}

assert_svg_file() {
  local path="$1"

  node - "$path" <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];
const svg = fs.readFileSync(path, "utf8");
if (!svg.startsWith("<svg ") || !svg.includes('xmlns="http://www.w3.org/2000/svg"') || !svg.includes("</svg>")) {
  throw new Error(`Exported SVG is not a complete SVG document: ${path}`);
}
if (!svg.includes("<rect") || (!svg.includes("<path") && !svg.includes("<foreignObject"))) {
  throw new Error(`Exported SVG is missing visible diagram geometry: ${path}`);
}
console.log(`Desktop smoke SVG export parsed: ${path}`);
NODE
}

assert_png_file() {
  local path="$1"

  node - "$path" <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];
const bytes = fs.readFileSync(path);
const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
if (bytes.length < signature.length || !signature.every((byte, index) => bytes[index] === byte)) {
  throw new Error(`Exported PNG does not have a PNG signature: ${path}`);
}
if (bytes.length < 1024) {
  throw new Error(`Exported PNG is unexpectedly small: ${path}`);
}
console.log(`Desktop smoke PNG export signature verified: ${path}`);
NODE
}

assert_pdf_file() {
  local path="$1"

  node - "$path" <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];
const bytes = fs.readFileSync(path);
const header = bytes.subarray(0, 5).toString("utf8");
const tail = bytes.subarray(Math.max(0, bytes.length - 64)).toString("latin1");
if (header !== "%PDF-") {
  throw new Error(`Exported PDF does not have a PDF header: ${path}`);
}
if (!tail.includes("%%EOF")) {
  throw new Error(`Exported PDF is missing EOF marker: ${path}`);
}
if (bytes.length < 1024) {
  throw new Error(`Exported PDF is unexpectedly small: ${path}`);
}
console.log(`Desktop smoke PDF export signature verified: ${path}`);
NODE
}

run_plain_launch_smoke() {
  local audit_path

  audit_path="$(mktemp -t structra-desktop-menu.XXXXXX)"
  rm -f "$audit_path"

  stop_existing_app
  launchctl setenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" "$audit_path"
  launchctl setenv "$DESKTOP_MENU_AUDIT_COMMANDS_ENV" "paste-selection,preferences"
  open -W "$APP_PATH" &
  OPEN_PID=$!
  trap cleanup EXIT
  wait_for_launch "plain launch"
  wait_for_native_menu_state "$audit_path" "document-save" "false"
  wait_for_native_menu_state "$audit_path" "open-workspace" "true"
  wait_for_native_menu_command "$audit_path" "paste-selection" "false"
  wait_for_native_menu_command "$audit_path" "preferences" "true"
  click_native_menu_item "文件" "打开本地工作台"
  wait_for_native_menu_command "$audit_path" "open-workspace" "true"
  quit_app
  wait "$OPEN_PID"
  launchctl unsetenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" >/dev/null 2>&1 || true
  launchctl unsetenv "$DESKTOP_MENU_AUDIT_COMMANDS_ENV" >/dev/null 2>&1 || true
  trap - EXIT
  OPEN_PID=""
  echo "Desktop smoke exited cleanly: $APP_NAME"
}

run_document_open_smoke() {
  local open_fixture_path="$1"
  local launch_mode="${2:-launchservices}"
  local attempt="${3:-0}"
  local app
  local audit_path
  local fixture
  local fixture_name

  app="$(absolute_path "$APP_PATH")"
  fixture="$(absolute_path "$open_fixture_path")"
  fixture_name="$(basename "$fixture")"
  audit_path="$(mktemp -t structra-desktop-open.XXXXXX)"
  rm -f "$audit_path"

  stop_existing_app
  register_app_bundle
  launchctl setenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" "$audit_path"
  if [[ "$launch_mode" == "args" ]]; then
    open -W -n -a "$app" --args "$fixture" &
  else
    open -W -a "$app" "$fixture" &
  fi
  OPEN_PID=$!
  trap cleanup EXIT
  wait_for_launch "open document $launch_mode"
  if ! wait_for_desktop_lifecycle_audit "$audit_path" "open-document" "$fixture" "$fixture_name"; then
    if [[ "$launch_mode" == "launchservices" ]]; then
      echo "Desktop smoke LaunchServices open did not emit an open-document audit; retrying with startup args for $fixture_name" >&2
      quit_app
      wait "$OPEN_PID" >/dev/null 2>&1 || true
      launchctl unsetenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" >/dev/null 2>&1 || true
      trap - EXIT
      OPEN_PID=""
      run_document_open_smoke "$open_fixture_path" "args"
      return
    fi
    if [[ "$launch_mode" == "args" && "$attempt" -lt 1 ]]; then
      echo "Desktop smoke startup-args open did not emit an open-document audit; retrying once for $fixture_name" >&2
      quit_app
      wait "$OPEN_PID" >/dev/null 2>&1 || true
      launchctl unsetenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" >/dev/null 2>&1 || true
      trap - EXIT
      OPEN_PID=""
      run_document_open_smoke "$open_fixture_path" "args" "$((attempt + 1))"
      return
    fi
    return 1
  fi
  wait_for_window_title "$fixture_name" || echo "Desktop smoke window title check skipped: macOS did not expose a readable title for $fixture_name"
  quit_app
  wait "$OPEN_PID"
  launchctl unsetenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" >/dev/null 2>&1 || true
  trap - EXIT
  OPEN_PID=""
  echo "Desktop smoke document-open exited cleanly: $fixture_name"
}

run_native_open_dialog_smoke() {
  local open_fixture_path="$1"
  local audit_path
  local fixture
  local fixture_name

  fixture="$(absolute_path "$open_fixture_path")"
  fixture_name="$(basename "$fixture")"
  audit_path="$(mktemp -t structra-desktop-open-dialog.XXXXXX)"
  rm -f "$audit_path"

  stop_existing_app
  launchctl setenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" "$audit_path"
  open -W "$APP_PATH" &
  OPEN_PID=$!
  trap cleanup EXIT
  wait_for_launch "native open dialog"
  wait_for_native_menu_state "$audit_path" "open-workspace" "true"
  click_native_menu_item "文件" "打开文档"
  wait_for_native_menu_event "$audit_path" "document-open"
  drive_open_panel_to_path "$fixture"
  wait_for_desktop_lifecycle_audit "$audit_path" "open-document" "$fixture" "$fixture_name"
  wait_for_native_menu_command "$audit_path" "document-open" "true"
  quit_app
  wait "$OPEN_PID"
  launchctl unsetenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" >/dev/null 2>&1 || true
  trap - EXIT
  OPEN_PID=""
  echo "Desktop smoke native open dialog verified: $fixture_name"
}

run_native_menu_save_smoke() {
  local open_fixture_path="$1"
  local app
  local audit_path
  local fixture
  local fixture_name

  app="$(absolute_path "$APP_PATH")"
  fixture="$(absolute_path "$open_fixture_path")"
  fixture_name="$(basename "$fixture")"
  audit_path="$(mktemp -t structra-desktop-menu-save.XXXXXX)"
  rm -f "$audit_path"

  stop_existing_app
  launchctl setenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" "$audit_path"
  open -W -n -a "$app" --args "$fixture" &
  OPEN_PID=$!
  trap cleanup EXIT
  wait_for_launch "native menu save"
  wait_for_desktop_lifecycle_audit "$audit_path" "open-document" "$fixture" "$fixture_name"
  wait_for_native_menu_state "$audit_path" "document-save" "false"
  wait_for_native_menu_state "$audit_path" "copy-selection" "false"
  wait_for_native_menu_state "$audit_path" "paste-selection" "false"
  click_native_menu_item "编辑" "全选节点"
  wait_for_native_menu_command "$audit_path" "select-all" "true"
  wait_for_native_menu_state "$audit_path" "copy-selection" "true"
  wait_for_native_menu_state "$audit_path" "delete-selection" "true"
  wait_for_native_menu_state "$audit_path" "fit-selection" "true"
  click_native_menu_item "编辑" "复制"
  wait_for_native_menu_command "$audit_path" "copy-selection" "true"
  wait_for_native_menu_state "$audit_path" "paste-selection" "true"
  click_native_menu_item "编辑" "粘贴"
  wait_for_native_menu_command "$audit_path" "paste-selection" "true"
  wait_for_native_menu_state "$audit_path" "document-save" "true"
  click_native_menu_item "文件" "保存文档"
  wait_for_native_menu_command "$audit_path" "document-save" "true"
  wait_for_desktop_lifecycle_audit "$audit_path" "save-document" "$fixture" "$fixture_name"
  wait_for_native_menu_state "$audit_path" "document-save" "false"
  assert_latest_native_menu_state "$audit_path" "document-save" "false"
  quit_app
  wait "$OPEN_PID"
  launchctl unsetenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" >/dev/null 2>&1 || true
  trap - EXIT
  OPEN_PID=""
  echo "Desktop smoke native menu selection/paste/save lifecycle verified: $fixture_name"
}

run_native_save_as_and_export_picker_smoke() {
  local open_fixture_path="$1"
  local app
  local audit_path
  local fixture
  local fixture_name
  local picker_dir
  local save_as_dir
  local save_as_path
  local export_json_dir
  local export_json_path
  local export_svg_dir
  local export_svg_path
  local export_png_dir
  local export_png_path
  local export_pdf_dir
  local export_pdf_path
  local export_document_pdf_dir
  local export_document_pdf_path
  local active_page_name

  app="$(absolute_path "$APP_PATH")"
  fixture="$(absolute_path "$open_fixture_path")"
  fixture_name="$(basename "$fixture")"
  active_page_name="$(active_page_name_for_fixture "$fixture")"
  audit_path="$(mktemp -t structra-desktop-save-export-dialog.XXXXXX)"
  rm -f "$audit_path"
  picker_dir="$(mktemp -d -t structra-desktop-picker.XXXXXX)"
  save_as_dir="$picker_dir/save-as-target"
  export_json_dir="$picker_dir/export-json-target"
  export_svg_dir="$picker_dir/export-svg-target"
  export_png_dir="$picker_dir/export-png-target"
  export_pdf_dir="$picker_dir/export-pdf-target"
  export_document_pdf_dir="$picker_dir/export-document-pdf-target"
  mkdir -p "$save_as_dir" "$export_json_dir" "$export_svg_dir" "$export_png_dir" "$export_pdf_dir" "$export_document_pdf_dir"
  save_as_dir="$(absolute_path "$save_as_dir")"
  export_json_dir="$(absolute_path "$export_json_dir")"
  export_svg_dir="$(absolute_path "$export_svg_dir")"
  export_png_dir="$(absolute_path "$export_png_dir")"
  export_pdf_dir="$(absolute_path "$export_pdf_dir")"
  export_document_pdf_dir="$(absolute_path "$export_document_pdf_dir")"
  save_as_path="$save_as_dir/$fixture_name"
  export_json_path="$export_json_dir/structra-diagram.json"
  export_svg_path="$export_svg_dir/$active_page_name.svg"
  export_png_path="$export_png_dir/$active_page_name.png"
  export_pdf_path="$export_pdf_dir/$active_page_name.pdf"
  export_document_pdf_path="$export_document_pdf_dir/structra-document.pdf"

  stop_existing_app
  launchctl setenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" "$audit_path"
  open -W -n -a "$app" --args "$fixture" &
  OPEN_PID=$!
  trap cleanup EXIT
  wait_for_launch "native save as and export picker"
  wait_for_desktop_lifecycle_audit "$audit_path" "open-document" "$fixture" "$fixture_name"

  click_native_menu_item "文件" "另存为文档"
  wait_for_native_menu_event "$audit_path" "document-save-as"
  drive_save_panel_to_directory "$save_as_dir"
  wait_for_desktop_lifecycle_audit "$audit_path" "save-document" "$save_as_path" "$fixture_name"
  wait_for_native_menu_command "$audit_path" "document-save-as" "true"
  assert_file_exists "$save_as_path" "Save As picker"

  click_native_menu_item "文件" "导出文档 JSON"
  wait_for_native_menu_event "$audit_path" "export-json"
  drive_save_panel_to_directory "$export_json_dir"
  wait_for_desktop_lifecycle_audit "$audit_path" "export-document" "$export_json_path" "structra-diagram.json"
  wait_for_native_menu_command "$audit_path" "export-json" "true"
  assert_file_exists "$export_json_path" "Export JSON picker"
  assert_json_file "$export_json_path"

  click_native_menu_item "文件" "导出当前页 SVG"
  wait_for_native_menu_event "$audit_path" "export-svg"
  drive_save_panel_to_directory "$export_svg_dir"
  wait_for_desktop_lifecycle_audit "$audit_path" "export-document" "$export_svg_path" "$active_page_name.svg"
  wait_for_native_menu_command "$audit_path" "export-svg" "true"
  assert_file_exists "$export_svg_path" "Export SVG picker"
  assert_svg_file "$export_svg_path"

  click_native_menu_item "文件" "导出当前页 PNG"
  wait_for_native_menu_event "$audit_path" "export-png"
  drive_save_panel_to_directory "$export_png_dir"
  wait_for_desktop_lifecycle_audit "$audit_path" "export-document" "$export_png_path" "$active_page_name.png"
  wait_for_native_menu_command "$audit_path" "export-png" "true"
  assert_file_exists "$export_png_path" "Export PNG picker"
  assert_png_file "$export_png_path"

  click_native_menu_item "文件" "导出当前页 PDF"
  wait_for_native_menu_event "$audit_path" "export-pdf"
  drive_save_panel_to_directory "$export_pdf_dir"
  wait_for_desktop_lifecycle_audit "$audit_path" "export-document" "$export_pdf_path" "$active_page_name.pdf"
  wait_for_native_menu_command "$audit_path" "export-pdf" "true"
  assert_file_exists "$export_pdf_path" "Export PDF picker"
  assert_pdf_file "$export_pdf_path"

  click_native_menu_item "文件" "导出文档 PDF"
  wait_for_native_menu_event "$audit_path" "export-document-pdf"
  drive_save_panel_to_directory "$export_document_pdf_dir"
  wait_for_desktop_lifecycle_audit "$audit_path" "export-document" "$export_document_pdf_path" "structra-document.pdf"
  wait_for_native_menu_command "$audit_path" "export-document-pdf" "true"
  assert_file_exists "$export_document_pdf_path" "Export document PDF picker"
  assert_pdf_file "$export_document_pdf_path"

  quit_app
  wait "$OPEN_PID"
  launchctl unsetenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" >/dev/null 2>&1 || true
  trap - EXIT
  OPEN_PID=""
  rm -rf "$picker_dir"
  echo "Desktop smoke native Save As and JSON/SVG/PNG/PDF picker exports verified: $fixture_name"
}

run_recent_restart_smoke() {
  local expected_first_path="$1"
  local expected_second_path="$2"
  local audit_path
  local expected_first_name

  expected_first_name="$(basename "$expected_first_path")"
  audit_path="$(mktemp -t structra-desktop-recent.XXXXXX)"
  rm -f "$audit_path"

  stop_existing_app
  launchctl setenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" "$audit_path"
  launchctl setenv "$DESKTOP_MENU_AUDIT_COMMANDS_ENV" "open-workspace,audit-accept-next-unsaved-prompt,open-first-recent-from-workspace"
  open -W "$APP_PATH" &
  OPEN_PID=$!
  trap cleanup EXIT
  wait_for_launch "recent restart"
  wait_for_desktop_lifecycle_audit "$audit_path" "recent-documents" "$expected_first_path" "$expected_first_name"
  assert_recent_audit_order "$audit_path" "$expected_first_path" "$expected_second_path"
  wait_for_native_menu_command "$audit_path" "open-first-recent-from-workspace" "true"
  wait_for_workspace_recent_open_audit "$audit_path" "workspace-recent-open-attempt" "$expected_first_path"
  wait_for_workspace_recent_open_audit "$audit_path" "workspace-recent-open-result" "$expected_first_path" "true"
  wait_for_desktop_lifecycle_audit "$audit_path" "open-document" "$expected_first_path" "$expected_first_name"
  click_native_menu_item "编辑" "全选节点"
  wait_for_native_menu_command "$audit_path" "select-all" "true"
  wait_for_native_menu_state "$audit_path" "copy-selection" "true"
  click_native_menu_item "编辑" "复制"
  wait_for_native_menu_command "$audit_path" "copy-selection" "true"
  wait_for_native_menu_state "$audit_path" "paste-selection" "true"
  click_native_menu_item "编辑" "粘贴"
  wait_for_native_menu_command "$audit_path" "paste-selection" "true"
  wait_for_native_menu_state "$audit_path" "document-save" "true"
  wait_for_native_menu_command "$audit_path" "audit-accept-next-unsaved-prompt" "true"
  wait_for_unsaved_discard_prompt_audit "$audit_path" "打开最近文档" "true" "audit-override"
  wait_for_desktop_lifecycle_audit "$audit_path" "open-document" "$expected_first_path" "$expected_first_name"
  wait_for_native_menu_state "$audit_path" "document-save" "false"
  quit_app
  wait "$OPEN_PID"
  launchctl unsetenv "$DESKTOP_LIFECYCLE_AUDIT_ENV" >/dev/null 2>&1 || true
  launchctl unsetenv "$DESKTOP_MENU_AUDIT_COMMANDS_ENV" >/dev/null 2>&1 || true
  trap - EXIT
  OPEN_PID=""
  echo "Desktop smoke recent restart, workspace Recent reopen, and unsaved discard audit verified: $(basename "$expected_first_path"), $(basename "$expected_second_path")"
}

run_plain_launch_smoke
FIRST_FIXTURE_PATH="$(prepare_open_fixture "$OPEN_FIXTURE_PATH" "desktop-smoke-open-a")"
SECOND_FIXTURE_PATH="$(prepare_open_fixture "$SECOND_OPEN_FIXTURE_PATH" "desktop-smoke-open-b")"
THIRD_FIXTURE_PATH="$(prepare_open_fixture "$SECOND_OPEN_FIXTURE_PATH" "desktop-smoke-open-c")"
FOURTH_FIXTURE_PATH="$(prepare_open_fixture "$OPEN_FIXTURE_PATH" "desktop-smoke-open-dialog")"
run_document_open_smoke "$FIRST_FIXTURE_PATH" "launchservices"
run_document_open_smoke "$SECOND_FIXTURE_PATH" "args"
run_native_open_dialog_smoke "$FOURTH_FIXTURE_PATH"
run_native_menu_save_smoke "$THIRD_FIXTURE_PATH"
run_recent_restart_smoke "$(absolute_path "$THIRD_FIXTURE_PATH")" "$(absolute_path "$SECOND_FIXTURE_PATH")"
run_native_save_as_and_export_picker_smoke "$THIRD_FIXTURE_PATH"
rm -rf "$SMOKE_FIXTURE_DIR"
