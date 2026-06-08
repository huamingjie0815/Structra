export type FileDialogFilter = { name: string; extensions: string[] };

export type SaveTextAsNativeFileResult =
  | { saved: true; path: string }
  | { saved: false; cancelled?: boolean; unavailable?: boolean; reason?: "native-unavailable" | "write-failed" | "dialog-failed"; error?: unknown };

export type SaveBlobAsNativeFileResult = SaveTextAsNativeFileResult;

export type OpenTextFileWithNativeDialogResult =
  | { opened: true; path: string; contents: string }
  | { opened: false; cancelled?: boolean; unavailable?: boolean; failed?: boolean; reason?: "native-unavailable" | "read-failed" | "dialog-failed"; path?: string; error?: unknown };

export type NativeOpenDocumentsHandler = (paths: string[]) => void;

export function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export async function registerNativeWindowCloseGuard(shouldConfirmClose: () => boolean, confirmClose: () => boolean) {
  if (!isTauriRuntime()) return null;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    return await getCurrentWindow().onCloseRequested((event) => {
      if (!shouldConfirmClose()) return;
      if (!confirmClose()) {
        event.preventDefault();
      }
    });
  } catch (error) {
    console.warn("Native close guard failed.", error);
    return null;
  }
}

export async function readTextFromNativePath(path: string): Promise<string | null> {
  if (!isTauriRuntime()) return null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("read_text_file", { path });
  } catch (error) {
    console.warn("Native read failed.", error);
    return null;
  }
}

export function normalizeNativeOpenDocumentPaths(paths: unknown) {
  if (!Array.isArray(paths)) return [];
  return paths.filter((path): path is string => typeof path === "string" && path.trim().length > 0);
}

export async function drainPendingNativeOpenDocumentPaths() {
  if (!isTauriRuntime()) return [];
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return normalizeNativeOpenDocumentPaths(await invoke("drain_pending_open_document_paths"));
  } catch (error) {
    console.warn("Native pending open-document drain failed.", error);
    return [];
  }
}

export async function listenForNativeOpenDocuments(handler: NativeOpenDocumentsHandler) {
  if (!isTauriRuntime()) return null;
  try {
    const { listen } = await import("@tauri-apps/api/event");
    return await listen("native-open-documents", (event) => {
      handler(normalizeNativeOpenDocumentPaths(event.payload));
    });
  } catch (error) {
    console.warn("Native open-document listener failed.", error);
    return null;
  }
}

export async function recordDesktopLifecycleAudit(event: string, payload: Record<string, unknown>) {
  if (!isTauriRuntime()) return false;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<boolean>("record_desktop_lifecycle_audit", { event, payload });
  } catch (error) {
    console.warn("Desktop lifecycle audit failed.", error);
    return false;
  }
}

export async function recordDesktopOpenAudit(path: string, documentName: string, source: string) {
  return recordDesktopLifecycleAudit("open-document", { path, documentName, source });
}

export async function recordDesktopSaveAudit(path: string, documentName: string, source: string) {
  return recordDesktopLifecycleAudit("save-document", { path, documentName, source });
}

export async function recordDesktopExportAudit(path: string, documentName: string, format: string) {
  return recordDesktopLifecycleAudit("export-document", { path, documentName, format });
}

export async function recordDesktopUnsavedDiscardPromptAudit(action: string, allowed: boolean, source = "user-confirm") {
  return recordDesktopLifecycleAudit("unsaved-discard-prompt", { action, allowed, source });
}

export async function recordDesktopUnsavedClosePromptAudit(allowed: boolean) {
  return recordDesktopLifecycleAudit("unsaved-close-prompt", { allowed });
}

export async function recordDesktopWorkspaceRecentOpenAttempt(path: string) {
  return recordDesktopLifecycleAudit("workspace-recent-open-attempt", { path });
}

export async function recordDesktopWorkspaceRecentOpenResult(path: string, opened: boolean) {
  return recordDesktopLifecycleAudit("workspace-recent-open-result", { path, opened });
}

export async function authorizeNativeFilePath(path: string) {
  if (!isTauriRuntime()) return false;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<boolean>("authorize_native_file_path", { path });
  } catch (error) {
    console.warn("Native path authorization failed.", error);
    return false;
  }
}

export async function openTextFileWithNativeDialog(filters: FileDialogFilter[]): Promise<OpenTextFileWithNativeDialogResult> {
  if (!isTauriRuntime()) return { opened: false, unavailable: true, reason: "native-unavailable" };
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const path = await open({ multiple: false, filters });
    if (!path || Array.isArray(path)) return { opened: false, cancelled: true };
    if (!(await authorizeNativeFilePath(path))) return { opened: false, failed: true, reason: "read-failed", path };
    const contents = await readTextFromNativePath(path);
    if (contents === null) return { opened: false, failed: true, reason: "read-failed", path };
    return { opened: true, path, contents };
  } catch (error) {
    console.warn("Native open failed; falling back to browser file input.", error);
    return { opened: false, failed: true, reason: "dialog-failed", error };
  }
}

export async function openTextWithNativeDialog(filters: FileDialogFilter[]) {
  const result = await openTextFileWithNativeDialog(filters);
  if (!result.opened) {
    if (result.cancelled) return null;
    if (result.unavailable && result.reason === "native-unavailable") return undefined;
    return null;
  }
  return result.contents;
}

export async function writeTextToNativePath(path: string, contents: string) {
  if (!isTauriRuntime()) return false;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_text_file", { path, contents });
    return true;
  } catch (error) {
    console.warn("Native save failed.", error);
    return false;
  }
}

export async function saveTextAsNativeFile(
  defaultPath: string,
  filters: FileDialogFilter[],
  contents: string
): Promise<SaveTextAsNativeFileResult> {
  if (!isTauriRuntime()) return { saved: false, unavailable: true, reason: "native-unavailable" };
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const path = await save({ defaultPath, filters });
    if (!path) return { saved: false, cancelled: true };
    if (!(await authorizeNativeFilePath(path))) return { saved: false, unavailable: true, reason: "write-failed" };
    const saved = await writeTextToNativePath(path, contents);
    return saved ? { saved: true, path } : { saved: false, unavailable: true, reason: "write-failed" };
  } catch (error) {
    console.warn("Native save failed; falling back to browser download.", error);
    return { saved: false, unavailable: true, reason: "dialog-failed", error };
  }
}

export async function saveTextWithNativeDialog(defaultPath: string, filters: FileDialogFilter[], contents: string) {
  const result = await saveTextAsNativeFile(defaultPath, filters, contents);
  return result.saved || Boolean(result.cancelled);
}

export async function saveBlobAsNativeFile(defaultPath: string, filters: FileDialogFilter[], blob: Blob): Promise<SaveBlobAsNativeFileResult> {
  if (!isTauriRuntime()) return { saved: false, unavailable: true, reason: "native-unavailable" };
  try {
    const [{ invoke }, { save }] = await Promise.all([import("@tauri-apps/api/core"), import("@tauri-apps/plugin-dialog")]);
    const path = await save({ defaultPath, filters });
    if (!path) return { saved: false, cancelled: true };
    if (!(await authorizeNativeFilePath(path))) return { saved: false, unavailable: true, reason: "write-failed" };
    const contents = Array.from(new Uint8Array(await blob.arrayBuffer()));
    await invoke("write_binary_file", { path, contents });
    return { saved: true, path };
  } catch (error) {
    console.warn("Native binary save failed; falling back to browser download.", error);
    return { saved: false, unavailable: true, reason: "write-failed", error };
  }
}

export async function saveBlobWithNativeDialog(defaultPath: string, filters: FileDialogFilter[], blob: Blob) {
  const result = await saveBlobAsNativeFile(defaultPath, filters, blob);
  return result.saved || Boolean(result.cancelled);
}
