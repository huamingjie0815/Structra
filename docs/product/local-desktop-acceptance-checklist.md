# Local Desktop Acceptance Checklist

Audit date: 2026-06-07

Purpose: define the next product-grade acceptance gate for Structra as a local single-user desktop diagram editor. This checklist is intentionally scoped to local machine behavior, native desktop workflows, editor architecture, and repeatable performance evidence.

## Scope Boundary

In scope:

- Local single-user desktop authoring.
- Local document files, local autosave, local recovery, and local version snapshots.
- Native menu commands and keyboard shortcuts.
- Local recent documents.
- Local imports and exports.
- Offline-capable performance benchmarks. Performance testing is deferred until feature completion is accepted for the current iteration.

Out of scope:

- Accounts, login, billing, user profiles, or identity.
- Cloud storage, cloud sync, cloud backup, or cross-device sync.
- Real-time collaboration, multiplayer editing, cursors, presence, invites, or permissions.
- Share links, public publishing, team spaces, organization workspaces, or remote comments.
- Online template marketplace, server-backed asset libraries, or telemetry requirements.

## Next-Phase Acceptance Items

### 1. `App.tsx` Split

- `src/App.tsx` acts as application composition plus high-level state wiring. Current marker: about 1258 lines. Line count is a complexity signal, not a release gate; exceeding 1200 lines is acceptable when responsibilities remain clear and new behavior lands behind tested modules/workflows.
- Remaining responsibilities are assigned to explicit modules: document workflow controller, editor command controller, panel composition, native desktop bridge, and review overlays. Document history, command items, keyboard shortcuts, native menu dispatch, presentation mode, local workspace actions, local document persistence, and desktop window lifecycle already have extracted workflow hooks.
- New product behavior does not add long-lived implementation logic to `src/App.tsx`.
- Mutations introduced during the split are routed through command/history helpers or extracted workflows, not one-off inline state updates. Page/template operations, inline label commits, element-editing graph mutations, clipboard paste/cut/duplicate/delete, shape insertion, connect/reconnect, React Flow drag/resize commits, edge waypoint/bend commits, comment add/reply/resolve/delete, New/Open/legacy import/version restore baseline replacement, page navigation baseline replacement, Mermaid import, version restore, and canvas settings already use explicit document command/controller paths. Search/comment/outline/select-all focus paths stay selection-only/non-history through the dedicated focus-selection workflow.
- Focused tests cover each newly extracted controller, helper, or workflow without mounting the full app where practical.
- Existing smoke selectors and visible command labels remain unchanged unless a deliberate product decision updates the tests and documentation together.

### 1a. Local Workspace Entry

- App launch presents a local workspace entry with New, Open, Recent, template search, and template category paths before the user returns to the editor.
- Workspace identifies the current document source as an untitled draft, native `.structra` file, compatible JSON import, browser-downloaded copy, or unknown recent-file format without implying cloud state.
- Workspace content is local-only and does not imply accounts, cloud storage, sharing, sync, or remote template marketplaces.
- Template favorites are local-only, available from the workspace and editor sidebar, survive refresh through local persistence, expose a workspace "收藏" filter, and are cleaned up when a local custom template is deleted.
- Applying a workspace template uses the same confirmation-protected page/template command path as the sidebar template list.
- Closing the workspace returns to the current editor state without resetting the document and writes `?id=<local-session>` so refresh stays in the editor.
- The visible editor topbar return button, toolbar Workbench command, and native File menu workspace command return to the workspace and write `?workspace=1`; blank-document and template workspace entries return to editor mode and preserve editor mode across refresh.
- Empty recent-document state is explicit and non-destructive.
- Browser preview recent-file clicks do not remove native recent entries when Tauri is unavailable; they show a desktop-required error, preserve the list for the desktop app, and stay in the workspace instead of switching into editor mode.
- Clearing recent documents is confirmation-protected, removes only local recent state, and does not delete files; browser smoke previously covered the clear-list path and needs a fresh run for the confirmation wrapper.

### 2. Native File Lifecycle

- New creates an untitled dirty document without overwriting the previous file path.
- Open from disk sets active file path, document title, dirty state, and window title.
- Save writes to the active path after the document has a path.
- Save As chooses a new local path, writes the file, updates the active path, updates the window title, and clears dirty state.
- Failed open, failed read, failed write, unsupported file, and corrupt file paths show actionable errors and preserve the current document. Current unit coverage asserts explicit failed read/write, missing-recent-file status mapping, pure lifecycle patches, unsaved-change discard confirmation before destructive imports, new dirty draft state, `.structra` fixture parsing, and non-destructive corrupt/unsupported import boundaries; desktop unsaved-prompt audit evidence now exists, while broader failure-state automation is still required before release acceptance.
- Tauri file commands reject relative paths, unsupported read/write extensions, and unauthorized paths before touching disk. Current Rust unit coverage checks this command boundary, proves an unauthorized write fails first, then proves authorized `.structra` document plus `.png` binary temp-file round trips. Native dialogs authorize selected paths, OS-opened paths are authorized by the pending-open bridge, and explicit Recent user actions authorize the selected local path before reading. The packaged app also declares `.structra` file associations, `qa:desktop` checks the macOS bundle `Info.plist` after a fresh package build, and the runtime bridges OS-opened document paths into the React native-open workflow. Successful native Open, Recent reopen, Save, Save As, export, workspace Recent attempt/result, and unsaved discard prompt paths emit Tauri-gated lifecycle audit records for desktop automation. `qa:desktop` now opens real `.structra` fixtures through LaunchServices/startup args, waits for frontend-written audit records after the files are read and parsed, clicks native Select All, Copy, Paste, and Save Document menu items against an active `.structra` path, verifies selection/paste/save state transitions plus a `save-document` audit, drives a real native Open panel to open a copied `.structra`, drives a real Save As panel to write a `.structra` copy, drives real Export JSON/SVG/PNG/PDF panels, verifies JSON/SVG parseability plus PNG/PDF file signatures, relaunches the packaged app, verifies the Recent list ordering, exercises workspace Recent reopen after restart, and records unsaved-prompt audit evidence. Release acceptance still needs SVG/PNG/PDF pixel/visual export baselines and stronger Finder double-click/window-title evidence where macOS automation permissions allow it.
- The packaged app has a non-null production CSP for local-only runtime resources; CSP verification is separate from the remaining desktop lifecycle gaps: Finder/window-title evidence and SVG/PNG/PDF pixel/visual baselines.
- Close, reload, New, and Open flows prompt when unsaved local changes would be lost. Browser/Tauri guard logic exists, destructive document actions now write `unsaved-discard-prompt` audit records, and `qa:desktop` has audit-only coverage for a dirty-document Recent reopen; native close/restart evidence still needs stronger coverage before release acceptance.
- Page deletion, template replacement, version restore, custom-template deletion, and recent-list clearing now require explicit confirmation before local state is replaced or removed. Template favorite cleanup for deleted local templates is part of the same local asset lifecycle and is covered by the current unit/browser verification batch.
- Autosave/recovery data is stored separately from intentional document saves.
- Legacy JSON/localStorage recovery remains importable without becoming the primary product file model.

### 3. Native Menu And Shortcuts

- Native menu commands are mapped to the same command registry or controller paths as toolbar, keyboard, and command-palette actions.
- New, Open, Save, Save As, Export, Print, Undo, Redo, Cut, Copy, Paste, Delete, Select All, zoom, presentation/preview, preferences, snap commands, and keyboard connector start/complete commands are implemented through toolbar, command-palette, keyboard, or native-menu paths where applicable.
- Disabled states match current selection, dirty state, active document state, and platform expectations. The frontend model now covers undo, redo, save, copy, cut, paste, duplicate, delete, fit-selection, preferences, workspace, and snap, with a Rust command to sync the OS menu. Desktop smoke now verifies the packaged app writes a native menu state audit showing `document-save=false` on clean startup, blocks a disabled native paste command at the frontend guard, handles enabled preferences and workspace commands, and proves selection/paste/save transitions by clicking native Select All, Copy, Paste, and Save Document, observing copy/delete/fit/paste/save state changes, recording `save-document`, and observing `document-save=false` again. A separate System Events run clicked the real macOS preferences menu item and recorded both Rust-side menu receipt and frontend command handling.
- Menu shortcuts do not fire while text fields or inline editors should own the keystroke.
- Native menu events are covered by tests or smoke automation with a documented fallback for commands that cannot be automated reliably.

### 4. Local Recent Documents

- Recent documents are stored only on the local machine.
- Opening or saving a file moves it to the top of the recent list without duplicate entries.
- Missing, renamed, or permission-denied recent files show non-destructive errors and can be removed from the list.
- Recent list ordering survives app restart. `qa:desktop` now proves a packaged-app sequence survives restart with the latest `.structra` first and the earlier entries preserved after external open, native Open picker, active-path Save, Save As, JSON/SVG/PNG/PDF export evidence, and an audit-only workspace Recent reopen workflow after restart without relying on unstable WebView AX clicks.
- Clearing recent documents does not delete document files; the current workspace clear action removes the local recent-document storage key only.
- Browser preview mode preserves native recent entries instead of treating Tauri-unavailable path reads as missing files, and failed recent opens do not close the workspace.
- Recent entries never imply cloud storage, sharing, account ownership, or remote availability.
- Recent entries show format/source badges derived from the local path only; missing-file checks still happen when the user opens the entry, not through background probing.

### 5. Performance Baseline

- `pnpm qa:perf` records repeatable results for 100, 500, and 1000 node fixtures. Do not treat this as current-iteration verification until feature completion work is accepted.
- Benchmarks include load, render-ready, pan, zoom, single-node selection, single-node drag move, area selection, undo, redo, JSON round-trip, and SVG export. Current drag and area-selection numbers are regression guardrails only; product-quality interaction targets remain open.
- Each benchmark records target machine, date, fixture size, threshold, measured result, and pass/fail status.
- 100-node diagrams pass interactive editing thresholds.
- 500-node diagrams pass navigation, selection, and selected-node edit thresholds.
- 1000-node diagrams have documented expectations; current guardrails pass, but pan and zoom remain product-quality risks that need optimization.
- Performance failures create concrete follow-up tasks tied to rendering, state updates, export generation, or history size.

### 6. Real Product Experience

- The app can complete a realistic local single-user authoring loop: start from workspace/template, return to the workspace, refresh without losing editor/workspace mode, edit a multi-page document, grow Mind/Org structures with child/sibling commands and `Tab`/`Enter`, save/open a local file, export a handoff artifact, restore a local version, and recover from a failed import without data loss. Browser smoke now covers the workspace/template, visible topbar workspace return, editor-mode refresh, multi-page, Mind/Org structured authoring, export, local version restore, cache recovery, failed-import portions, and `.structra` fixture import; desktop smoke now checks packaged `.structra` document-type registration, LaunchServices/startup-args open into the frontend native-open lifecycle, native-menu workspace return, native selection/copy/paste, native-menu save to an active file path, native Open picker, native Save As picker, native JSON/SVG/PNG/PDF export pickers, Recent ordering after restart, restarted workspace Recent reopen, and unsaved-prompt audit. SVG/PNG/PDF pixel/visual export baselines and stronger Finder double-click/window-title evidence remain required before release acceptance.
- Command/history behavior is predictable across visible workflows. Current browser smoke covers drag, resize, manual waypoint add/drag, source and target reconnect, group move, and group/ungroup undo/redo; transient selection-only search/comment/outline focus side effects are routed through a non-history focus controller.
- Desktop behavior must be verified at the app level, not only through browser fallback tests: native dialogs, OS menu enabled state, recent reopen after restart, unsaved prompts, and failure states need repeatable coverage or documented manual evidence. Current desktop smoke covers initial native menu Save-disabled synchronization, native menu dispatch/guard evidence, native workspace return command, selection/copy/paste menu transitions, dirty/save menu transition for an active document path, external open, native Open picker, native Save As picker, native JSON/SVG/PNG/PDF export pickers, Recent ordering after restart, restarted workspace Recent reopen, and unsaved prompt audit; failure states and SVG/PNG/PDF pixel/visual baselines still need stronger app-level evidence.
- ProcessOn-like local authoring depth is credible for the P0 diagram families: flowchart, BPMN, UML, ER, mind map, and org chart each now have at least three realistic built-in templates. Mind map and org chart have initial family-specific layout commands through the toolbar and command palette, plus single and batch semantic inspector controls. Remaining release work is export fidelity expectations, deeper layout options, and family-specific editing evidence.
- Import/export trust has initial rich `.structra` fixture evidence for multi-page documents, settings, BPMN/ER/table/mind semantic fields, comment replies, hidden graph filtering, visible JSON/Mermaid/SVG exports, plus `.structra` fixture parsing/import evidence. Mermaid unsupported/corrupt failure fixtures, SVG XML escaping coverage, native Open/Save As/JSON/SVG/PNG/PDF picker evidence, and basic JSON/SVG/PNG/PDF file validity checks exist. Remaining release work is broader fixture variety, SVG/PNG/PDF pixel/visual baselines, and fidelity expectations for exported diagrams.
- Accessibility checks cover keyboard navigation and labeled controls for the workspace, toolbar, sidebars, page list, command palette, inspectors, inline editors, dialogs, and presentation/review overlays.
- Current accessibility progress: the canvas surface has accessible names, local workspace template categories expose tab state, command palette exposes active option navigation, and `scripts/qa/accessibility-keyboard-audit.mjs` records the remaining static gaps. Browser-level keyboard automation is still required for release acceptance.
- Large diagrams are usable, not merely benchmark-passing: 500/1000-node pan, zoom, selection, drag move, and undo/redo have product-quality thresholds tied to the target Mac and current measurements.

## Release Gate

The next product-grade local desktop milestone is not accepted until:

- All P0 local desktop checklist items are passing or explicitly deferred with rationale.
- `pnpm test`, `pnpm build`, `pnpm test:e2e`/smoke, Rust command tests, and explicitly requested performance results have current results recorded. The current verification record lives in `docs/product/local-verification-log.md`; performance should not be rerun until feature completion work is accepted for the current iteration.
- Tauri desktop build succeeds on the target Mac.
- `src/App.tsx` line count is reviewed as a complexity signal only; exceeding 1200 lines does not fail the milestone when responsibilities remain clear, extracted modules retain locality, and command/history behavior is tested.
- No acceptance item requires cloud collaboration, accounts, sharing, team workspaces, online presence, or sync.
