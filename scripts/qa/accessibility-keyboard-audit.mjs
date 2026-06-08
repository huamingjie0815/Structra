import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../..", import.meta.url);

function read(relativePath) {
  return readFileSync(join(root.pathname, relativePath), "utf8");
}

const files = {
  app: read("src/App.tsx"),
  keyboard: read("src/editor/keyboardShortcuts.ts"),
  iconButton: read("src/components/IconButton.tsx"),
  commandPalette: read("src/components/CommandPalette.tsx"),
  canvas: read("src/components/CanvasWorkspace.tsx"),
  overlays: read("src/components/Overlays.tsx"),
  preferences: read("src/components/PreferencesDialog.tsx"),
  presentation: read("src/components/PresentationOverlay.tsx"),
  localWorkspace: read("src/components/LocalWorkspacePanel.tsx"),
  library: read("src/components/LibrarySidebar.tsx")
};

function has(source, pattern) {
  return pattern.test(source);
}

function check(id, label, ok, detail) {
  return { id, label, ok, detail };
}

function buttonWithClassHasAriaLabel(source, classNameFragment) {
  const buttonBlocks = source.match(/<button\b[\s\S]*?<\/button>/g) ?? [];
  return buttonBlocks.some((block) => block.includes(classNameFragment) && /aria-label=/.test(block));
}

const checks = [
  check(
    "icon-button-labels",
    "Shared icon buttons expose title and aria-label",
    has(files.iconButton, /aria-label=\{label\}/) && has(files.iconButton, /title=\{label\}/),
    "Icon-only toolbar controls should stay on the shared IconButton path."
  ),
  check(
    "global-shortcuts",
    "Global editor shortcuts cover core local commands",
    ["cmd/ctrl+f", "cmd/ctrl+k", "cmd/ctrl+s", "cmd/ctrl+o", "cmd/ctrl+n", "arrows", "delete", "escape"].every((name) => {
      const patterns = {
        "cmd/ctrl+f": /key === "f"/,
        "cmd/ctrl+k": /key === "k"/,
        "cmd/ctrl+s": /key === "s"/,
        "cmd/ctrl+o": /key === "o"/,
        "cmd/ctrl+n": /key === "n"/,
        arrows: /ArrowUp[\s\S]*ArrowDown[\s\S]*ArrowLeft[\s\S]*ArrowRight/,
        delete: /Delete[\s\S]*Backspace/,
        escape: /Escape/
      };
      return has(files.keyboard, patterns[name]);
    }),
    "Keep keyboardShortcuts.ts as the source of truth for global shortcuts."
  ),
  check(
    "editable-target-guard",
    "Global shortcuts ignore editable controls",
    has(files.keyboard, /input, textarea, select, \[contenteditable='true'\]/),
    "Inputs and textareas must not trigger canvas nudging or destructive shortcuts."
  ),
  check(
    "dialog-semantics",
    "Primary overlays expose dialog semantics",
    [files.commandPalette, files.preferences, files.presentation].every((source) => has(source, /role="dialog"/) && has(source, /aria-modal="true"/)),
    "Command palette, preferences, and presentation should remain modal to assistive tech."
  ),
  check(
    "inline-editors",
    "Inline node and edge editors are labeled textareas",
    has(files.canvas, /aria-label="节点文本编辑"/) && has(files.canvas, /aria-label="连线文本编辑"/),
    "Direct label editing needs a focused text control with commit/cancel keys."
  ),
  check(
    "canvas-accessible-name",
    "Canvas editing surface has an explicit accessible name",
    /<ReactFlow\b[^>]*(aria-label|aria-labelledby)=/.test(files.canvas) || /className="canvas-region"[^>]*(aria-label|aria-labelledby)=/.test(files.canvas),
    "Missing today: canvas-region and ReactFlow usage need a stable accessible name and object-selection model."
  ),
  check(
    "context-menu-role",
    "Context menu exposes menu roles",
    has(files.overlays, /role="menu"/) && has(files.overlays, /role="menuitem"/),
    "Missing today: right-click menu is button-only and pointer-first."
  ),
  check(
    "context-menu-keyboard",
    "Context menu supports keyboard navigation",
    has(files.overlays, /onKeyDown/) && /ArrowDown|ArrowUp|Home|End/.test(files.overlays),
    "Missing today: menu needs focus entry, arrow navigation, Escape close, and focus restore."
  ),
  check(
    "command-palette-active-option",
    "Command palette exposes an active option model",
    has(files.commandPalette, /aria-activedescendant/) && /ArrowDown|ArrowUp|Home|End/.test(files.commandPalette),
    "Missing today: palette runs the first result on Enter but has no roving active item."
  ),
  check(
    "focus-trap",
    "Modal overlays trap and restore focus",
    /focusTrap|previousFocus|activeElement|returnFocus/.test([files.commandPalette, files.preferences, files.presentation].join("\n")),
    "Missing today: dialogs have modal roles but no shared focus lifecycle."
  ),
  check(
    "workspace-tabs",
    "Workspace template tabs expose tab state",
    has(files.localWorkspace, /role="tablist"/) && has(files.localWorkspace, /role="tab"/) && has(files.localWorkspace, /aria-selected/),
    "Missing today: tablist exists, but individual tab buttons need tab semantics."
  ),
  check(
    "active-list-state",
    "Active page, outline, and layer rows expose selected/current state",
    /aria-current|aria-selected/.test(files.library),
    "Missing today: active rows mostly use CSS classes without semantic state."
  ),
  check(
    "comment-marker-label",
    "Canvas comment markers have specific accessible names",
    buttonWithClassHasAriaLabel(files.canvas, "comment-marker"),
    "Missing today: comment marker buttons have title text but no aria-label."
  ),
  check(
    "status-live-region",
    "Document status changes are exposed through a polite live region",
    has(files.app, /role="status"/) && has(files.app, /aria-live="polite"/),
    "Save state, import/export outcomes, and keyboard connector mode should be announced without stealing focus."
  )
];

const passed = checks.filter((item) => item.ok);
const failed = checks.filter((item) => !item.ok);

const lines = [
  "# Accessibility And Keyboard Static Audit",
  "",
  `Passed: ${passed.length}`,
  `Gaps: ${failed.length}`,
  "",
  "## Passing Signals",
  ...passed.map((item) => `- ${item.id}: ${item.label}`),
  "",
  "## Gaps To Productize",
  ...failed.map((item) => `- ${item.id}: ${item.label}. ${item.detail}`),
  "",
  "This helper is read-only and intentionally exits 0; use docs/qa/accessibility-keyboard.md for the manual acceptance path."
];

console.log(lines.join("\n"));
