import { useEffect } from "react";
import { recordDesktopUnsavedClosePromptAudit, registerNativeWindowCloseGuard } from "../io/nativeFiles";

export function buildDocumentWindowTitle(documentName: string, documentDirty: boolean) {
  return `${documentDirty ? "*" : ""}${documentName} - Structra`;
}

export function useDesktopWindowLifecycle(documentName: string, documentDirty: boolean) {
  useEffect(() => {
    const title = buildDocumentWindowTitle(documentName, documentDirty);
    document.title = title;
    if (!("__TAURI_INTERNALS__" in window)) return;
    import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => getCurrentWindow().setTitle(title))
      .catch((error) => console.warn("Failed to update window title.", error));
  }, [documentDirty, documentName]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!documentDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    let cancelled = false;
    let unlistenNativeClose: (() => void) | null = null;
    registerNativeWindowCloseGuard(
      () => documentDirty,
      () => {
        const allowed = window.confirm("当前文档有未保存更改，确定关闭吗？");
        void recordDesktopUnsavedClosePromptAudit(allowed);
        return allowed;
      }
    ).then((unlisten) => {
      if (cancelled) {
        unlisten?.();
        return;
      }
      unlistenNativeClose = unlisten;
    });

    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", onBeforeUnload);
      unlistenNativeClose?.();
    };
  }, [documentDirty]);
}
