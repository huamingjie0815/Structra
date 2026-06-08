export type EditorKeyboardShortcutHandlers = {
  focusOutlineSearch: () => void;
  openCommandPalette: () => void;
  saveDocument: () => void;
  saveDocumentAs: () => void;
  openDocument: () => void;
  newDocument: () => void;
  nudgeSelectedNodes: (dx: number, dy: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitCanvas: () => void;
  undo: () => void;
  redo: () => void;
  duplicateSelection: () => void;
  copySelection: () => void;
  cutSelection: () => void;
  pasteClipboard: () => void;
  selectAllNodes: () => void;
  deleteSelection: () => void;
  closeContextMenu: () => void;
  exitPreviewMode: () => void;
  completeKeyboardConnector: () => boolean;
  appendStructuredNode: (mode: "child" | "sibling") => boolean;
};

export type KeyboardShortcutEvent = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  target: EventTarget | null;
  preventDefault: () => void;
};

export function isEditableShortcutTarget(target: EventTarget | null) {
  const closest = (target as { closest?: (selector: string) => Element | null } | null)?.closest;
  return Boolean(closest?.call(target, "input, textarea, select, [contenteditable='true']"));
}

export function handleEditorKeyDown(event: KeyboardShortcutEvent, handlers: EditorKeyboardShortcutHandlers) {
  const key = event.key.toLowerCase();
  const commandKey = event.metaKey || event.ctrlKey;

  if (commandKey && key === "f") {
    event.preventDefault();
    handlers.focusOutlineSearch();
    return true;
  }
  if (commandKey && key === "k") {
    event.preventDefault();
    handlers.openCommandPalette();
    return true;
  }
  if (commandKey && key === "s") {
    event.preventDefault();
    if (event.shiftKey) {
      handlers.saveDocumentAs();
    } else {
      handlers.saveDocument();
    }
    return true;
  }
  if (commandKey && key === "o") {
    event.preventDefault();
    handlers.openDocument();
    return true;
  }
  if (commandKey && key === "n") {
    event.preventDefault();
    handlers.newDocument();
    return true;
  }

  if (isEditableShortcutTarget(event.target)) return false;

  if (!commandKey) {
    const step = event.shiftKey ? 10 : 1;
    const directionKeys: Record<string, [number, number]> = {
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0]
    };
    const offset = directionKeys[event.key];
    if (offset) {
      event.preventDefault();
      handlers.nudgeSelectedNodes(offset[0], offset[1]);
      return true;
    }
  }

  if (commandKey) {
    if (key === "+" || key === "=") {
      event.preventDefault();
      handlers.zoomIn();
      return true;
    }
    if (key === "-" || key === "_") {
      event.preventDefault();
      handlers.zoomOut();
      return true;
    }
    if (key === "0") {
      event.preventDefault();
      handlers.fitCanvas();
      return true;
    }
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      handlers.undo();
      return true;
    }
    if (key === "y" || (event.shiftKey && key === "z")) {
      event.preventDefault();
      handlers.redo();
      return true;
    }
    if (key === "d") {
      event.preventDefault();
      handlers.duplicateSelection();
      return true;
    }
    if (key === "c") {
      event.preventDefault();
      handlers.copySelection();
      return true;
    }
    if (key === "x") {
      event.preventDefault();
      handlers.cutSelection();
      return true;
    }
    if (key === "v") {
      event.preventDefault();
      handlers.pasteClipboard();
      return true;
    }
    if (key === "a") {
      event.preventDefault();
      handlers.selectAllNodes();
      return true;
    }
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    handlers.deleteSelection();
    return true;
  }
  if (event.key === "Escape") {
    handlers.closeContextMenu();
    handlers.exitPreviewMode();
    return true;
  }
  if (event.key === "Tab" && !event.shiftKey) {
    if (handlers.appendStructuredNode("child")) {
      event.preventDefault();
      return true;
    }
  }
  if (event.key === "Enter") {
    if (handlers.completeKeyboardConnector()) {
      event.preventDefault();
      return true;
    }
    if (handlers.appendStructuredNode("sibling")) {
      event.preventDefault();
      return true;
    }
  }

  return false;
}
