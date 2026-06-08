import { useEffect, useRef } from "react";
import { drainPendingNativeOpenDocumentPaths, listenForNativeOpenDocuments } from "../io/nativeFiles";

export type NativeOpenDocumentSource = "startup" | "event";
export type NativeOpenDocumentHandler = (path: string, source: NativeOpenDocumentSource) => Promise<boolean> | boolean;

export function getUniqueNativeOpenDocumentPaths(paths: string[], openedPaths: Set<string>) {
  const unique: string[] = [];
  for (const path of paths) {
    const normalized = path.trim();
    if (!normalized || openedPaths.has(normalized)) continue;
    openedPaths.add(normalized);
    unique.push(normalized);
  }
  return unique;
}

export function getNativeOpenDocumentSource(source: NativeOpenDocumentSource, now: number, startupOpenDeadline: number): NativeOpenDocumentSource {
  if (source === "startup" || now <= startupOpenDeadline) return "startup";
  return "event";
}

export function useNativeOpenDocumentWorkflow(onOpenDocumentPath: NativeOpenDocumentHandler) {
  const openedPathsRef = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    let unlisten: null | (() => void) = null;
    const startupOpenDeadline = Date.now() + 5_000;

    const openDocumentPaths = async (paths: string[], source: NativeOpenDocumentSource) => {
      const uniquePaths = getUniqueNativeOpenDocumentPaths(paths, openedPathsRef.current);
      for (const path of uniquePaths) {
        if (cancelled) return;
        const opened = await onOpenDocumentPath(path, getNativeOpenDocumentSource(source, Date.now(), startupOpenDeadline));
        if (opened) return;
      }
    };

    const drainPendingDocumentPaths = async (source: NativeOpenDocumentSource) => {
      await openDocumentPaths(await drainPendingNativeOpenDocumentPaths(), source);
    };

    void listenForNativeOpenDocuments((paths) => {
      void openDocumentPaths(paths, "event").then(() => drainPendingDocumentPaths("event"));
    }).then((dispose) => {
      if (cancelled) {
        dispose?.();
        return;
      }
      unlisten = dispose;
    });

    void drainPendingDocumentPaths("startup");

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [onOpenDocumentPath]);
}
