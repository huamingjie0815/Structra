# Accessibility And Keyboard QA

This note tracks local-only accessibility and keyboard reachability for the single-user diagram editor. It intentionally excludes accounts, cloud sync, sharing links, multiplayer presence, and permission workflows.

## Current Coverage

- Global shortcuts exist for file commands, command palette, search, zoom, undo/redo, clipboard, duplicate, select all, delete, Escape, and arrow-key nudging. Source: `src/editor/keyboardShortcuts.ts`.
- Icon-only toolbar buttons use the shared `IconButton`, which provides `title` and `aria-label`.
- Command palette, preferences, and presentation overlays expose `role="dialog"` with `aria-modal="true"`.
- Inline node and edge text editors are textareas with accessible labels and Escape/Enter handling.
- Sidebar search fields, inspector controls, layer visibility/lock buttons, comment reply fields, and import errors expose basic labels or alert semantics.
- Canvas editing surface now has stable accessible names on the canvas region and React Flow object surface.
- Command palette now exposes a listbox-style active option model with ArrowUp/ArrowDown, Home/End, `aria-activedescendant`, visible active styling, disabled-item skipping, and wraparound navigation.
- Local workspace template category controls now expose tab semantics with `role="tab"` and `aria-selected`.
- Context menus expose `role="menu"` / `role="menuitem"`, focus the active item, support ArrowUp/ArrowDown/Home/End, close on Escape, and restore focus when dismissed.
- Command palette, preferences, and presentation overlays share modal focus lifecycle handling for initial focus, Tab wrapping, Escape close where applicable, and return focus.
- Page rows, outline rows, layer rows, and comment markers expose current/selected state or specific accessible names.
- Keyboard connector authoring is available through the command palette: select a source node, run "从选中节点开始键盘连线", select a target node, then press Enter to create the default connector.
- Document status changes, including dirty state and keyboard connector mode, are exposed through a polite `role="status"` live region.

## Product Gaps

### P0: Keyboard Completion

- Canvas nodes and edges do not expose a first-class keyboard focus model. Selection is available through outline/layers, and the canvas surface has an accessible name, but canvas objects still do not provide roving focus, object names, selected state, or Enter/F2 edit semantics.
- Canvas object creation is available through commands and keyboard selection through outline/layers, but direct canvas-object roving focus is still missing.

### P1: Modal And Focus Trust

- Presentation mode has keyboard paging, but the rendered SVG stage is not labeled as document content and does not expose a summary for screen readers.
- Toolbar, inspector, page list, inline editors, context menus, and dialogs now have stronger static coverage, but still need a browser-level keyboard smoke that verifies Tab order, focus return, and expected active states end to end.

### P2: Screen Reader Detail

- React Flow MiniMap and Controls are injected components. Their accessible names and tab order need browser verification after any React Flow upgrade.
- Coordinate readout and detailed import/export logs are visible, but not yet covered by a dedicated browser screen-reader smoke.
- Complex semantic node content, tables, UML, ER, BPMN, mind map, and org nodes are visually richer than their accessible names. The editor needs a text alternative strategy per selected object.

## Manual Keyboard Acceptance Path

Run this after feature changes that affect editor navigation, toolbars, overlays, or dialogs:

1. Launch the app locally with the normal dev or smoke workflow.
2. Use Tab from initial load. Expected: focus moves through the local workspace/editor controls in a predictable order without trapping on hidden controls.
3. Press `Cmd/Ctrl+K`. Expected: command palette opens, focus lands in search, Escape closes it, and focus returns to the invoking context.
4. Search for "添加流程节点", run it, then use the outline or layer list to select the new node. Expected: selection is reachable without a mouse.
5. Select a source node, run "从选中节点开始键盘连线", select a target node, then press Enter. Expected: a default connector is created and undo removes it.
6. Use Arrow keys and Shift+Arrow on the selected node. Expected: node nudges by small/large increments, and editable inputs do not trigger canvas nudging while focused.
7. Open inline edit from the quickest available keyboard path. Expected: node or edge label editor receives focus, Enter commits, Escape cancels.
8. Open preferences and presentation mode from the command palette. Expected: Escape closes each overlay and focus does not escape behind the modal while it is open.
9. Verify page actions, template application, outline selection, layer visibility, lock/unlock, and recent-document remove buttons are all reachable through Tab and have meaningful accessible names.

## Static Audit Helper

Use the helper for a quick, read-only signal:

```bash
node scripts/qa/accessibility-keyboard-audit.mjs
```

The helper does not replace browser testing. It checks for known accessibility affordances and known gaps in the current component structure, then prints a Markdown report. It exits with status 0 so it can be used during feature work without blocking unrelated local builds. Current result after the context-menu, modal-focus, active-list-state, comment-marker, keyboard-connector, and status-live-region pass: `Passed: 14`, `Gaps: 0`.

## Next Implementation Slices

1. Add a browser-level accessibility smoke for focus trap/return focus, context menus, active list states, comment markers, and keyboard connector creation.
2. Add canvas object focus semantics through outline/layer selection first, then optional direct canvas roving focus when React Flow compatibility is clear.
3. Add browser-level status announcement checks for save state, import/export outcomes, and keyboard connector mode.
4. Define selected-object text alternatives for complex semantic nodes such as tables, UML, ER, BPMN, mind map, and org chart content.
