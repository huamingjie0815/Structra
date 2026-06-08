# ProcessOn Parity Product Roadmap

Audit date: 2026-06-07

Scope: Structra is a local-first, single-user Tauri + React desktop diagram editor aiming for ProcessOn-like flowchart/productivity coverage. This roadmap treats ProcessOn as a product benchmark for editor depth, template breadth, file workflow, and professional reliability. Accounts, cloud sync, share-link publishing, sharing permissions, team workspaces, and real-time collaboration are intentionally out of scope for this product direction unless the product direction is explicitly changed later.

References used as authoring-depth benchmark signals. Cloud/networked product items mentioned here are treated only as exclusion evidence and local-substitute prompts, not as backlog requirements:

- ProcessOn flowchart product page: https://www.processon.io/flowcharts. Authoring benchmark signals: flowcharts, swimlanes, UML, BPMN, ER, templates, AI generation, history, and export/import formats including PNG, VISIO, PDF, and SVG. ProcessOn's online collaboration and cloud storage claims are exclusion signals for this local-only roadmap.
- ProcessOn home/help content: https://www.processon.io/. Authoring benchmark signals: import POS/Excel/XMind/VISIO, restore historical versions, and export mind maps/flowcharts in common handoff formats. ProcessOn's share/collaborative-file permissions claims are exclusion signals for this local-only roadmap.
- ProcessOn Visio alternative page: https://www.processon.io/visio. Authoring benchmark signals: many diagram families, AI generation, rich graphic libraries, themes, and Visio-compatible workflows. ProcessOn's multi-person collaboration and multi-device cloud sync claims are exclusion signals for this local-only roadmap.

## Current Capabilities

Evidence inspected and current extraction notes:

- `src/App.tsx`: about 1258 lines after the current modularization passes; this is a complexity marker, not an acceptance gate. It still owns high-level app composition and some editor wiring, but no longer owns the full canvas, toolbar, library, overlay, presentation workflow, inspector, auto-route, placement, alignment-guide, group-selection operation, graph-selection operation, command-items workflow, command-palette workflow, editor keyboard workflow, keyboard connector logic, clipboard workflow, focus selection operation, element property operation, element editing workflow, structured Mind/Org insertion operation, React Flow change operation, comment workflow, page/template action workflow, inline label editing workflow, document history/controller implementation, selector, shortcut-dispatch, command-registry, local document-file workflow, local workspace actions, workspace/editor URL route model, local document persistence workflow, document restore workflow, page navigation workflow, shape creation workflow/operation, native desktop window lifecycle, native menu workflow, native menu listener/dispatch bridge, canvas-settings workflow, local preferences, custom-template persistence, template-favorite persistence, or version-history persistence implementations inline.
- `src/components/CanvasWorkspace.tsx`: React Flow workspace composition, canvas-local panels, page frame, grid/rulers, alignment guides, comment markers, and inline node/edge editors.
- `src/components/CanvasPrimitives.tsx`: React Flow node renderer, edge renderer, edge waypoint handles, and canvas rulers.
- `src/components/ReviewPanels.tsx`: local-only version history and review-comment panels, replacing earlier cloud-collaboration wording with local desktop review semantics.
- `src/io/documentFile.ts`: versioned `.structra` document file parser/serializer.
- `src/io/exporters.ts`: document JSON export, Mermaid export, and visible graph filtering helpers.
- `src/io/mermaid.ts`: Mermaid import/export helpers for common flowchart syntax, with explicit unsupported/corrupt failure boundaries.
- `src/io/browserDownloads.ts`: browser fallback file/blob download helpers.
- `src/io/pdfExport.ts`: SVG-to-PNG/PDF rasterization and lightweight PDF assembly helpers.
- `src/io/svgExport.ts`: SVG serialization for visible graph exports, including node semantics, edge labels, and XML attribute escaping for imported text/style data.
- `src/io/importers.ts`: JSON and versioned `.structra` import classifier.
- `src/io/nativeFiles.ts`: isolated Tauri native open/save/read/write bridge.
- `src/io/recentDocuments.ts`: local recent-document storage and ordering helpers.
- `src/domain/documentSession.ts`: local document recovery, active-page sync, canvas setting normalization, version/template loading, and document cloning helpers.
- `src/domain/localWorkspace.ts`: local workspace template filtering plus document identity and recent-file display models for draft, native `.structra`, compatible JSON, browser-download copy, and unknown recent-file formats.
- `src/domain/workspaceRoute.ts`: local workspace/editor URL state helpers. `?id=<local-session>` means editor mode, `?workspace=1` means explicit workspace mode, and no parameter falls back to the startup workspace preference.
- `src/editor/edgeGeometry.ts`: shared edge style, waypoint, endpoint, label-position, and path helpers.
- `src/editor/geometry.ts`: shared node rotation, visual bounds, and export bounds helpers.
- `src/editor/autoRoute.ts`: selected-edge obstacle-aware waypoint ranking and route simplification helpers.
- `src/editor/canvasGeometry.ts`: node placement, rect/segment intersection, and alignment-guide helpers.
- `src/editor/reactFlowChangeOperations.ts`: React Flow change adapter for locked-node move/resize filtering, resize dimension sync, edge changes, connect, and reconnect.
- `src/editor/elementOperations.ts`: pure inspector/editing operations for node and edge property patches, format painter application, label commits, simple horizontal/vertical auto-layout, family-specific mind map and org chart layout, visibility propagation, and layer movement. Locked nodes are skipped by node data patches, format painter node patches, node label commits, auto-layout, and layer movement except for explicit lock/unlock state changes.
- `src/editor/selection.ts`: group-selection helper that excludes hidden grouped nodes.
- `src/editor/selectionOperations.ts`: pure selection/focus operations for grouped node selection, single node/edge selection, clear selection, select-all, and comment-target focus.
- `src/editor/focusSelection.ts`: pure non-history focus-selection helper for outline/document-search node targeting, comment targeting, select-all selection state, and viewport follow intent.
- `src/editor/graphOperations.ts`: pure graph-selection operations for copy/cut/paste/duplicate/delete, group/ungroup, nudge, align/distribute, and z-order changes. Locked nodes are skipped by duplicate, group, ungroup, align/distribute, and z-order mutations, and delete/cut already preserve locked nodes.
- `src/editor/commentOperations.ts`: pure local review operations for adding, resolving, deleting, and replying to comments.
- `src/editor/documentSelectors.ts`: pure selectors for visible shapes, custom+built-in template ordering, outline nodes, layer ordering, and document-wide page/node search.
- `src/editor/keyboardShortcuts.ts`: testable desktop keyboard shortcut dispatcher that preserves text-field editing boundaries.
- `src/editor/commandRegistry.ts`: stable command-palette item registry with command IDs, labels, run handlers, and disabled rules outside `App.tsx`.
- `src/editor/connectorPresets.ts`: semantic connector presets for flow arrows, UML/ER association, bidirectional, inheritance, aggregation, and composition edges.
- `src/editor/history.ts`: document-level history entry stack for `DiagramDocument + Selection`, with undo/redo/dedupe/redo-truncation helpers.
- `src/editor/commands.ts`: landed pure document-level commands for add/duplicate/rename/delete/reorder page, apply-template, inline node/edge label commits, active-page graph replacement, and active-page snapshot replacement including comments, returning `DiagramDocument + Selection` entries that are pushed through `src/editor/history.ts`.
- `src/features/document/useCustomTemplates.ts`: local custom-template hook and helpers for template cloning, capped persistence, and deletion.
- `src/features/document/useDocumentHistoryController.ts`: document history controller hook for document refs, autosave recovery sync, current document/page derivation, undo/redo, graph replace, document transactions, whole-document baseline replacement, page navigation baseline replacement, React Flow drag/resize and edge route commits, and document-level canvas-settings commits outside `App.tsx`.
- `src/features/document/useDocumentFileWorkflow.ts`: local-first document lifecycle hook for dirty state, window title data, save/save-as, open/recent files, browser/Tauri import fallback, JSON/Mermaid import, SVG/PNG/PDF export, print, import errors, and local document-name normalization.
- `src/features/document/useWorkspaceActionsWorkflow.ts`: local workspace entry action workflow for new/open/recent/template entry points outside `App.tsx`.
- `src/features/document/useLocalDocumentPersistenceWorkflow.ts`: local recovery-cache save, manual cache-save status marking, version snapshot save, and confirmation-protected version restore workflow outside `App.tsx`.
- `src/features/document/useDocumentRestoreWorkflow.ts`: document restore workflow for preparing restored versions as whole-document baseline history entries before the history controller applies them.
- `src/features/document/usePageActionsWorkflow.ts`: undoable local page/template action workflow for add/duplicate/rename/delete/reorder page, confirmation-protected delete/template replacement, and save current page as a custom template.
- `src/features/document/usePageNavigationWorkflow.ts`: page open and document-search navigation workflow for active-page sync, comment normalization, focus-selection preparation, history reset, and fit-view intent.
- `src/features/document/useVersionHistory.ts`: local version-history hook and helpers for snapshot creation, capped persistence, display naming, and restore snapshot normalization.
- `src/features/comments/useCommentWorkflow.ts`: local review workflow for comment anchor calculation, add/reply/resolve/delete, open-comment filtering, and delegation to the shared focus-selection workflow for comment navigation.
- `src/features/editor/useClipboardWorkflow.ts`: local clipboard workflow for copy, cut, paste, duplicate, delete, paste availability, and paste offset state. Paste/cut/duplicate/delete now commit through active-page document transactions, including comment cleanup on delete.
- `src/features/editor/useCommandItemsWorkflow.ts`: command registry composition workflow that builds palette items and async command wrappers outside `App.tsx`.
- `src/features/editor/useCommandPaletteWorkflow.ts`: command-palette open/query/run workflow for palette state and disabled-command handling outside `App.tsx`.
- `src/features/editor/useElementEditingWorkflow.ts`: editor workflow hook for node/edge property edits, locking, grouping, selected-edge routing, format application, nudge/align/distribute, z-order, auto layout, hide/show, and layer movement. These visible graph edits now commit through the active-page document command path instead of calling `replaceGraph` directly.
- `src/features/editor/useEditorKeyboardWorkflow.ts`: desktop keyboard shortcut listener workflow that connects the pure shortcut dispatcher to app commands outside `App.tsx`.
- `src/features/editor/useFocusSelectionWorkflow.ts`: non-history focus-selection workflow that applies prepared selection state and viewport intent for outline, document-search, select-all, and comment focus without creating undo entries.
- `src/features/editor/useInlineLabelEditingWorkflow.ts`: inline node/edge label editing workflow for draft state, focus management, selection setup, commit, and cancel behavior outside `App.tsx`. Label commits now use document-level command transactions.
- `src/features/presentation/usePresentationWorkflow.ts`: local presentation-mode workflow for page index, keyboard navigation, SVG generation, and open/close state.
- `src/features/shapes/shapeCreation.ts`: shape insertion operation for node defaults, click-add placement, drag/drop centered placement, edge deselection, and new-node selection state.
- `src/features/shapes/useShapeInsertionWorkflow.ts`: shape insertion workflow that computes fallback placement and commits inserted shapes through active-page document transactions.
- `src/desktop/nativeMenuCommands.ts`: native menu command dispatch and Tauri menu-event listener bridge, keeping desktop menu payload handling outside `App.tsx`.
- `src/desktop/useDesktopWindowLifecycle.ts`: local desktop window title, browser unload guard, and Tauri close-confirm workflow.
- `src/desktop/useNativeMenuWorkflow.ts`: native menu controller hook that wires menu payloads to palette, editor, zoom, export, and print commands outside `App.tsx`.
- `src/domain/nodeSemantics.ts`: shared node styling, rotation normalization, UML/ER/table/swimlane normalization, and divider geometry helpers.
- `src/domain/shapeSpecs.ts`: icon-free shape dimensions, labels, and default colors shared by UI and importers.
- `src/components/AppErrorBoundary.tsx`: app-level recoverable runtime error fallback.
- Current UI component extraction pass: `IconButton`, `CommandPalette`, `TopToolbar`, `ExportPanel`, `LibrarySidebar`, `LocalWorkspacePanel`, `PreferencesDialog`, `PropertySidebar`, `Inspectors`, `Overlays`, `PresentationOverlay`, `CanvasWorkspace`, and `CanvasPrimitives` now live under `src/components`, so large pieces of product UI no longer have to live inline in `src/App.tsx`.
- `src/styles.css`: 3101 lines of application styling.
- `src-tauri/src/lib.rs`: Tauri native menu and file read/write commands. File commands now require absolute local paths and restrict extensions by operation: document/text reads, document/text/SVG writes, and PNG/PDF binary writes, with Rust command tests covering `.structra` document and `.png` binary temp-file round trips.
- `src-tauri/tauri.conf.json`: packaged desktop app config for `Structra`, including a production local-only CSP plus a dev CSP for Vite/HMR.
- `vite.config.ts`: manual chunk strategy for React, React Flow, Tauri, icons, editor core, editor UI, and shell UI chunks; current build no longer emits the previous >500 kB bundle warning.
- `package.json`: Vite, Tauri, React, React Flow build scripts plus `test`, `test:unit`, `test:e2e`, `qa`, `qa:smoke`, and `qa:perf`.
- `scripts/qa/unit-tests.mjs`: fast Vite SSR unit runner for document files including `.structra` fixture parsing, document session recovery, commands/history, Mermaid success plus unsupported/corrupt failure fixtures, visible graph filtering, SVG semantics and XML escaping, edge geometry, auto-route, canvas geometry, selection operations, graph operations, clipboard workflow module loading, command-items workflow module loading, command-palette workflow module loading, editor keyboard workflow module loading, presentation workflow module loading, native menu workflow module loading, element editing workflow module loading, desktop window lifecycle helpers, local document persistence helpers, document selectors, keyboard shortcuts, command registry, native menu command dispatch, document file workflow helpers, recent-document helpers, document restore helpers, page navigation helpers, local workspace favorite filtering/counting, template favorite persistence helpers, comment operations, shape creation, node semantics, and shape default cloning.
- `scripts/qa/performance-baseline.mjs`: repeatable synthetic 100/500/1000-node baseline for JSON stringify/parse and SVG export.
- `tests/performance/interactive-performance.js` and `scripts/qa/interactive-performance.sh`: browser-driven 100/500/1000-node baseline for render-ready, outline-driven selection, zoom, pan, single-node drag move, area selection, undo, and redo. This is wired into `pnpm qa:perf`.
- `docs/product/local-verification-log.md`: current local verification record for test/build/Playwright/performance/Tauri build results and remaining verification gaps.

The app already has a broad prototype-level surface:

- Desktop shell: Tauri app window, app-level error boundary, extracted native menu bridge, native dialog fallback for file open/save, app title updates.
- Canvas: React Flow canvas, select/pan/connect tools, zoom, fit view, rulers, grid, snap settings, page frame presets, background color.
- Shape library: basic flowchart shapes, BPMN start/end/task/gateway, UML class, ER entity/attribute/relationship, dedicated mind map topic/branch nodes, dedicated org person/unit nodes, swimlane, table, off-page connector, notes and common flowchart primitives.
- Templates: approval flow, swimlane, data pipeline, BPMN approval, UML order classes, ER order model, organization chart using org-specific nodes, incident response swimlane, BPMN order fulfillment, UML service model, ER inventory model, SIPOC process analysis, mind map using mind-specific nodes, blank canvas, plus local custom templates, local template favorites, and a workspace favorites filter.
- Editing: drag/drop and click-add shapes, inline node/edge label editing, node inspector, edge inspector, batch node/edge styling, lock/unlock, hide/show, layer ordering, group/ungroup, equal-width/equal-height/equal-size matching, duplicate/copy/cut/paste/delete, keyboard shortcuts.
- Layout helpers: align, distribute, simple horizontal/vertical auto layout, initial mind map branch layout, initial org chart hierarchy layout, alignment guides, selected-edge auto-route around obstacles, manual edge waypoints and bend offset.
- Multi-page document: page thumbnails, add/copy/rename/delete/reorder pages, document search across pages. Page operations now use undoable document transactions instead of local UI-only state mutations.
- Semantic diagram support: UML class attributes/methods, ER fields with PK/FK markers and cardinality labels, swimlane labels, table cells.
- Persistence: localStorage autosave, explicit "save to local cache", local version history capped to 20 versions, custom templates capped to 16 with delete controls, template favorites capped to 64, and local recent-document management with format badges plus a confirmation-protected non-destructive clear-list action.
- Import/export: default-format export action, JSON import/export, Mermaid import/export, SVG/PNG/PDF export, document PDF export, print current page.
- Review/presentation/preferences: comments with replies/resolved state, presentation mode, preview mode, command palette, light/dark/system theme preference, default export preference, canvas default preferences; native menu can toggle preview mode and open the local preferences dialog.
- QA: committed Playwright smoke coverage for app load, standalone local workspace rendering without the editor topbar/command toolbar/canvas behind it, local workspace document identity, workspace-layer import-error dismissal, workspace/editor URL state across editor entry, visible topbar return-to-workspace, blank workspace entry, template workspace entry, and refresh, IO round-trip helpers, command helper module assertions, template application, page creation undo/redo, node creation, edge creation, undo/redo, local version save/restore after an extra edit, single-node drag move with undo/redo, node resize with undo/redo, manual edge waypoint add/drag, source/target reconnect, group move, Mind/Org layout command discovery plus layout-result undo/redo, Mind/Org structured child/sibling authoring through toolbar and `Tab`/`Enter`, group/ungroup undo/redo, locked delete protection, dirty state, JSON/SVG export, local cache restore, legacy JSON import, versioned `.structra` import, and `.structra` fixture import. Unit coverage now also asserts locked-node protection for property patches, labels, format painter, duplicate, group/ungroup, align, generic layout, mind map layout, org chart layout, structured Mind/Org insertion, `Tab`/`Enter` structure shortcuts, workspace route state, unsaved-change import protection, layer operations, native menu enabled-state guards, local workspace document identity/recent-file display models, dedicated mind/org shape families, Mermaid unsupported/corrupt failures, SVG XML escaping, and `.structra` fixture parsing. Rust command coverage now includes temp-file read/write round trips for `.structra` and `.png`, while desktop smoke covers native JSON/SVG/PNG/PDF export pickers with basic file validity checks.

Current product risk:

- A substantial amount of orchestration still lives in `App.tsx`. Its current roughly 1258-line size is a complexity marker only, not a product acceptance gate; future growth is acceptable when the module remains application composition plus high-level state wiring. The highest-density UI/workflow clusters have moved out: toolbar, command palette, command-items workflow, command-palette state workflow, editor keyboard workflow, keyboard connector helpers, library sidebar, property sidebar, inspectors, overlays, presentation overlay, presentation state workflow, canvas workspace, node/edge renderers, rulers, auto-route, canvas placement/alignment, React Flow change operations, clipboard workflow, element property operations, element editing workflow, structured Mind/Org insertion operation, inline label editing workflow, page/template action workflow, document history controller, selection/focus operations, focus-selection workflow, group selection, graph-selection operations, comment operations, comment workflow, document selectors, keyboard shortcuts, command registry, local document-file workflow, local workspace actions, workspace route state, local document persistence workflow, document restore workflow, page navigation workflow, shape creation operation, canvas settings workflow, desktop window lifecycle, native menu workflow, native menu bridge, local preferences model/dialog, custom-template persistence, template-favorite persistence, and version-history persistence. File/import/export, Mermaid, PDF, SVG export, document session helpers, document-level history helpers, command helpers, edge geometry, connector presets, node semantics, shared geometry helpers, and shape specs are already split. Remaining architecture work should focus on panel composition and desktop automation rather than more purely visual extraction.
- The command model is more productized than before: command-palette registration and item composition are centralized, page/template operations, inline label commits, element-editing graph mutations, clipboard paste/cut/duplicate/delete, shape insertion, connect/reconnect, React Flow drag/resize commits, edge waypoint/bend commits, comment add/reply/resolve/delete, whole-document New/Open/legacy import/version restore baseline replacement, page navigation baseline replacement, Mermaid import, and document-level canvas settings now use document-level command/controller paths, and keyboard/native-menu dispatch is testable outside React. Native menu disabled state now syncs from undo/redo, dirty state, clipboard, and selection availability with a Rust-side setter plus a frontend dispatch guard. Selection-only focus paths such as outline selection, document-search node targeting, select-all, and comment focus now use a dedicated non-history focus-selection workflow rather than masquerading as undoable mutations.
- Regression coverage is stronger than before: the smoke test covers command helpers, page creation undo/redo, Mind/Org structured child/sibling authoring through buttons and `Tab`/`Enter`, single-node drag move undo/redo, node resize undo/redo, manual edge waypoint add/drag undo/redo, source and target reconnect undo/redo, group move undo/redo, group/ungroup undo/redo, locked delete protection, browser export fallback, local cache restore, JSON/.structra import, `.structra` fixture import, and corrupt import protection, while `pnpm test` now covers extracted domain/editor/io helpers including auto-route, canvas geometry, React Flow change operations, element property operations, structured Mind/Org insertion, locked-node mutation protection, unsaved-change import protection, selection/focus operations, graph operations, comment operations, document selectors, keyboard shortcuts, command registry, document workflow helpers, document restore helpers, custom-template helpers, version-history helpers, Mermaid unsupported/corrupt failure fixtures, SVG XML escaping, and rich `.structra` fixtures for pages, settings, semantic fields, comments, hidden layers, and visible JSON/Mermaid/SVG export filtering. Desktop smoke now covers restarted workspace Recent reopen and unsaved-prompt audit via audit-only native commands. Remaining gaps are broader undo/redo breadth, multi-step connector coverage, accessibility automation, SVG/PNG/PDF pixel/visual baselines, and optimization of large-diagram pan/zoom/drag/selection behavior.
- The app is feature-rich enough to demo, but still needs local desktop lifecycle hardening, broader command semantics, accessibility coverage, and large-diagram interaction optimization before it can be called a product.

Current real-product experience gaps that are not captured by `App.tsx` line count:

- Command/history consistency: most explicit toolbar/inspector/clipboard/page/template mutations plus React Flow drag/resize commits, edge waypoint/bend commits, comment add/reply/resolve/delete, New/Open/import/restore baselines, page navigation baseline, Mermaid import, and canvas settings now use document transactions or controller baselines. Selection-only focus side effects now have clearer controller ownership and explicit non-history rationale through the focus-selection workflow.
- Desktop file confidence: Save/Open/Save As/recent-list ordering/recovery behavior exists, and file-lifecycle state transitions are now modeled in a pure module with unit coverage for save success, opened native documents, browser-download fallback, write failure, new dirty draft, browser import, missing recent, and recent clear. Browser smoke now also verifies that Tauri-unavailable recent opens stay in the workspace and preserve native recent entries. Rust command tests prove unauthorized file writes are rejected until a path is authorized, then temp-file read/write round trips work for `.structra` documents and `.png` binary export payloads. The Tauri bundle now declares `.structra` file associations, desktop smoke checks the packaged macOS `Info.plist` for those document types after a fresh package build, and the runtime now bridges startup arguments plus Tauri `RunEvent::Opened` file URLs into the frontend native-open workflow. Successful native Open, Recent reopen, Save, Save As, export, workspace Recent attempt/result, and unsaved discard prompt paths now write desktop lifecycle audit records. Desktop smoke verifies initial native menu Save-disabled synchronization, verifies native menu frontend dispatch/guard behavior, opens real `.structra` fixtures through LaunchServices/startup args, drives the native Open picker to read a `.structra`, clicks native Select All/Copy/Paste/Save against the active `.structra` path, relaunches the packaged app and verifies Recent ordering, exercises restarted workspace Recent reopen and unsaved-prompt audit, then drives native Save As and JSON/SVG/PNG/PDF export panels, verifies JSON/SVG parseability, and checks PNG/PDF signatures. Rendered OS menu inspection, SVG/PNG/PDF pixel/visual baselines, and stronger Finder double-click/window-title evidence still need desktop-level end-to-end coverage before users can trust it like a normal Mac app.
- Editing ergonomics: core creation, single-node drag move, node resize, manual waypoint add/drag, source and target reconnect, group move, and styling flows work, but a real product still needs contextual actions, robust selection retention, and undo/redo coverage across realistic multi-step diagrams.
- Diagram-family depth: BPMN, UML, ER, mind map, and org chart are present as local shape families, each P0 family now has at least three realistic built-in templates, and mind/org now have initial family-specific layout commands plus single and batch semantic inspector controls. ProcessOn-like usage still needs richer variants, deeper layout controls, and realistic authoring-flow coverage for those families.
- Import/export trust: `.structra`, `.structra`, JSON, Mermaid, SVG, PNG, and PDF have explicit support boundaries, and Tauri file commands now reject relative paths plus unsupported read/write extensions. Rich `.structra` fixtures cover multi-page documents, settings, semantic fields, comments, hidden layers, visible export filtering, and browser file-chooser import for `.structra`. Mermaid unsupported/corrupt failure fixtures, SVG XML escaping coverage, native Save As picker evidence, and native JSON/SVG/PNG/PDF export picker evidence have landed. Visio, XMind, and Excel remain unsupported. The next product step is broader visual/export baselines and user-visible fidelity expectations, not silent format parity promises.
- Accessibility and keyboard reach: many controls have labels, the canvas surface now has accessible names, workspace template categories expose tab state, command palette exposes active option navigation, context menus expose keyboard menu semantics, modal overlays share focus lifecycle handling, active page/outline/layer rows expose current state, comment markers have specific labels, keyboard connector authoring exists, and the static audit helper currently reports 14/0. Toolbar, inspector, page list, inline editors, live regions, direct canvas object focus, and complex semantic node alternatives still need repeatable browser-level keyboard/screen-reader checks.
- Large-diagram usability: current guardrails pass, but 500/1000-node pan, zoom, drag move, and area-selection timings still feel like optimization risks rather than product-quality interaction targets.

## Local-First Versus Cloud ProcessOn

ProcessOn is primarily a cloud collaboration product. Structra intentionally remains a local single-user desktop product, so cloud requirements are not backlog items for the current direction. Where ProcessOn uses cloud infrastructure, this product needs a local desktop substitute instead. The parity target is authoring depth and file/workflow quality, not cloud/team parity.

The next implementation phase should be accepted against `docs/product/local-desktop-acceptance-checklist.md`. That checklist is the source of truth for local desktop readiness and intentionally excludes cloud collaboration, accounts, sharing, team spaces, online presence, and sync work.

Cloud capabilities that are out of scope:

- Real-time multi-user editing.
- Cloud workspace/team/project permissions.
- Share links, public publishing, comments visible to remote collaborators.
- Cloud template marketplace, cross-device sync, organization-level asset libraries.
- Server-backed account, billing, audit logs, and role management.
- Any UI that implies login, invite, role assignment, online presence, or remote permission management.

Required local-first substitutes:

- Real file workflow using local project files, not only browser localStorage.
- Local autosave and crash recovery.
- Local version snapshots and restorable history.
- Portable exports for handoff: JSON project, SVG, PNG, PDF, Mermaid, and later Visio-compatible import/export where feasible.
- Optional Git-friendly file export can support manual handoff, but collaborative editing itself is out of scope.

## P0 Gaps

P0 means required before this can be treated as a product-grade local desktop diagram editor.

Remaining P0 pressure points, sharpened for the current local-only desktop direction:

- Architecture: `App.tsx` is currently about 1258 lines after extracting visual UI clusters, React Flow change operations, clipboard workflow, command-items workflow, command-palette workflow, editor keyboard workflow, keyboard connector helpers, presentation workflow, local document persistence workflow, document history controller, desktop window lifecycle, element property operations, element editing workflow, structured Mind/Org insertion operation, inline label editing workflow, page/template action workflow, selection/focus operations, focus-selection workflow, selector helpers, shortcut dispatch, command registry, comment operations, comment workflow, document file workflow, local workspace actions workflow, workspace route state, document restore workflow, page navigation workflow, shape creation operation, native menu workflow, native menu bridge, native menu enabled-state model, custom-template persistence, template-favorite persistence, preferences, export panel, and version-history persistence. Treat the number as a complexity signal, not a hard gate. Panel composition and native desktop automation still need deeper command/state seams.
- Transactions: every user-visible mutation must travel through a predictable command/history path. Page operations, template application, inline label commits, high-frequency element editing, clipboard paste/cut/duplicate/delete, shape insertion, connect/reconnect, React Flow drag/resize commits, edge waypoint/bend commits, comment add/reply/resolve/delete, whole-document New/Open/legacy import/version restore baseline replacement, page navigation baseline replacement, Mermaid import, version restore, and canvas settings now use document-level command/controller paths; selection-only focus paths now stay non-history through the dedicated focus-selection workflow.
- Desktop trust: Save/Open/Save As/Export flows must have repeatable desktop evidence, not only browser fallback or unit coverage. Tauri file commands now have a local path boundary plus authorization before read/write, Rust temp-file round-trip coverage for `.structra` and `.png`, packaged app file-association checks for `.structra`, an external-open event bridge from OS file URLs/startup args into React, success-path lifecycle audit hooks for Open/Recent/Save/Save As/Export, workspace Recent attempt/result audit hooks, unsaved discard prompt audit hooks, an initial native menu Save-disabled synchronization audit, native menu command dispatch/guard evidence, a LaunchServices/startup-args smoke assertion that verifies the frontend read and parsed real `.structra` fixtures, native Open picker evidence for `.structra`, native-menu workspace return evidence, native-menu Select All/Copy/Paste evidence that updates selection and paste availability, native-menu Save Document evidence that turns active-file dirty state back off while writing the current file, a packaged-app relaunch assertion that Recent is ordered with the latest saved `.structra` first while preserving earlier paths, workspace Recent reopen after restart, unsaved-prompt audit evidence, native Save As picker evidence for `.structra`, native Export JSON picker evidence with a parsed file, native Export SVG picker evidence with parsed SVG, native Export PNG picker evidence with a valid PNG signature, and native current-page/document Export PDF picker evidence with valid PDF headers and EOF markers. Rendered OS menu inspection, SVG/PNG/PDF pixel/visual export baselines, and stronger Finder double-click/window-title assertions remain open.
- Local document identity: workspace and status chrome should make it clear whether the current work is an untitled draft, bound local `.structra` file, compatible JSON import, or browser-downloaded copy. Initial local workspace identity, recent-file format badges, `.structra` fixture import, non-destructive browser-preview recent-open handling that stays in the workspace on failure, non-destructive recent-list clearing, workspace/editor URL state, packaged-app Recent ordering after restart, and restarted workspace Recent reopen audit evidence exist.
- Authoring loop: browser smoke now covers workspace/template start, visible workspace return, editor-mode refresh, multi-page page creation undo/redo, graph authoring, Mind/Org child/sibling structure growth through toolbar and `Tab`/`Enter`, local version save/restore, export, local cache recovery, failed import recovery, and `.structra` fixture import. Desktop smoke now covers native menu dispatch/guard behavior, native workspace return, LaunchServices/startup-args open into the native-open lifecycle for real `.structra` fixtures, native Open picker, native-menu selection/copy/paste, active-path native-menu save after dirtying a document, ordered Recent persistence after packaged-app restart, restarted workspace Recent reopen, unsaved-prompt audit, native Save As picker, and native JSON/SVG/PNG/PDF export pickers. SVG/PNG/PDF pixel/visual export baselines and stronger Finder/window-title evidence remain.
- Professional diagram depth: Flowchart, BPMN, UML, ER, mind map, and org chart each need richer templates and semantic editing where relevant. Mind map and org chart have initial layout commands plus single and batch semantic inspector controls; remaining work is deeper layout control and realistic family-specific authoring coverage.
- Interaction precision: single-node drag move now has browser automation with undo/redo and exported-coordinate assertions; node resize has exported-size assertions; manual edge waypoint add and waypoint dragging have exported-route assertions; source and target reconnect have exported-endpoint assertions; group move has exported-coordinate assertions for both grouped nodes; keyboard connector creation has command-palette plus Enter smoke coverage. Multi-step connector editing and broader undo/redo flows still need browser automation beyond smoke-level node creation.
- Large-diagram usability: 500/1000-node pan, zoom, selection, drag move, area selection, and undo/redo need product-quality thresholds tied to the target Mac, not only guardrail pass/fail.
- Local file lifecycle: real document paths, dirty state, save/open/recent/recovery, and unsaved prompts must behave like a desktop app, not a browser demo. New documents now stay dirty until saved, and local recent-list clearing removes only local recent state.
- Regression coverage: broaden fast unit tests plus stable smoke coverage for editor flows, command transactions, imports/exports, and native desktop behavior. Initial `pnpm test`, Rust command tests, and Playwright smoke coverage now exist.
- Editor precision: selection, locking, grouping, connectors, routing, keyboard shortcuts, and semantic inspectors must be reliable in realistic diagrams.
- Performance: repeatable large-diagram baselines now exist, and the latest 1000-node pan guardrail passes after syncing canvas viewport state on move end instead of every move frame. 500/1000-node pan and zoom are still product-quality pressure points, not solved design goals.

### P0.1 Modular Product Architecture

Problem: `App.tsx` no longer owns nearly everything, but it still owns enough high-level composition and cross-workflow wiring that testability, performance work, and safe feature development depend on clearer responsibility seams.

Required work:

- Split domain types and normalization into `src/domain`.
- Split canvas/editor behavior into `src/editor` or `src/canvas`.
- Split shape registry/rendering into `src/shapes`.
- Split templates into `src/templates`.
- Split import/export into `src/io`.
- Initial split exists for JSON export helpers, Mermaid import/export helpers, browser download helpers, PDF/PNG generation, SVG export rendering, document session helpers, document history controller, document restore workflow, local workspace actions workflow, local document persistence workflow, page navigation workflow, shape creation operation, native menu bridge, native menu workflow, desktop window lifecycle, command-items workflow, command-palette workflow, editor keyboard workflow, presentation workflow, document-level history helpers, document command helpers, React Flow change operations, clipboard workflow, element property operations, element editing workflow, selection/focus operations, focus-selection workflow, graph-selection operations, comment operations, custom-template helpers, version-history helpers, edge geometry, node semantics, and shared shape specs.
- Extract shared UI primitives and app chrome into `src/components`; the current `IconButton`, `CommandPalette`, `TopToolbar`, `LibrarySidebar`, `PropertySidebar`, `Inspectors`, `Overlays`, `PresentationOverlay`, `CanvasWorkspace`, and `CanvasPrimitives` pass should be treated as meaningful progress, not the finish.
- Continue command extraction beyond the landed `src/editor/commands.ts` page/template, label, active-page graph, active-page snapshot, and clipboard transaction paths plus `src/editor/commandRegistry.ts` palette registry so all remaining editor mutations become pure, testable document transactions instead of inline `App.tsx` state logic.
- Continue hardening the extracted local document-file workflow with focused tests for native save/open/recent-file branches and desktop dialog fallbacks.
- Continue splitting page/template panels, review panels, version restore panels, and desktop workflow controls into deeper modules where doing so improves locality and testability.
- Keep Tauri bridge code isolated in `src/desktop`.

Acceptance criteria:

- `src/App.tsx` remains application composition plus high-level state wiring. Its line count is reported as a complexity marker during reviews, but acceptance depends on clear responsibilities, extracted product workflows, command/history consistency, and focused tests rather than staying under 1200 lines.
- The next split plan identifies the remaining `App.tsx` responsibilities by owner: document workflow controller, editor command controller, panel composition, native menu bridge, and presentation/review overlays.
- No new feature work adds additional long-lived implementation logic to `src/App.tsx`; new behavior lands behind extracted hooks, controllers, command helpers, or components with focused tests.
- The toolbar and command palette are no longer implemented inline in `App.tsx`, and follow-up extraction tickets exist for inspector and panel clusters.
- Shape definitions, template definitions, import/export code, and domain normalization are not defined in `App.tsx`.
- Page/template, label, active-page graph, and active-page snapshot commands can be exercised without mounting the React app. Initial smoke assertions import `src/editor/commands.ts` directly and verify add/duplicate/rename/delete/reorder/apply-template, label commit, graph replacement, and snapshot/comment replacement behavior; unit tests also cover selector, shortcut, graph-operation, and command-registry modules.
- `pnpm build` passes.
- At least one focused unit or component test covers each extracted domain area: shape defaults, template loading, command transactions, JSON document normalization, SVG export path generation, and version snapshot restoration.
- Existing visible behavior remains covered by a Playwright smoke test before and after the split.

### P0.2 Real Local File Model

Problem: localStorage autosave is not enough for a desktop product. Users need real documents with paths, dirty state, save/open semantics, and recovery.

Required work:

- Define first-class `.structra` document formats with schema version. Initial shared schema/version wrapper exists for both extensions.
- Implement New, Open, Save, Save As, Recent Files, dirty-state indicator, window title path/status, and unsaved close/reload protection. Initial New/Open/Save/Save As/Recent Files/dirty title plus browser/Tauri close guards exist.
- Add migration for older JSON/localStorage documents.
- Add local autosave recovery separate from intentional saves.
- Keep local draft recovery, active-page sync, settings normalization, and version/template recovery behind a document session module. Initial `src/domain/documentSession.ts` exists with smoke coverage for recovery, legacy migration, settings repair, and comment normalization.
- Add import error details and non-destructive failed import behavior. Initial JSON/Mermaid/recent-file error banner exists and corrupt JSON smoke coverage verifies the current document stays unchanged.
- Keep native file lifecycle failures explicit. Initial `src/features/document/documentFileStatus.ts` maps failed open, read, write, and missing recent-file branches to actionable UI messages; Tauri write failures no longer clear dirty state or silently become successful saves. Rust-side file commands now reject relative paths and unsupported read/write extensions before touching disk.

Acceptance criteria:

- Opening a document from disk sets the active file path and window title.
- `Cmd/Ctrl+S` writes to the active path after initial Save As.
- Closing, reloading, or switching unsaved documents surfaces an unsaved-changes prompt.
- Recent files reopen successfully after app restart.
- Recent documents are strictly local machine state: entries are stored locally, missing files are handled without data loss, ordering is deterministic after reopen/save, and clearing recents does not alter document files.
- Save, Save As, Open, New, recent reopen, failed read, failed write, and recovery paths are covered by unit tests or desktop smoke tests with native-dialog fallbacks mocked where needed. Initial unit coverage now asserts opened-native document lifecycle patches, native-unavailable browser fallback, native write failure, read failure, missing-recent-file status mapping, `.structra` fixture parsing, and Playwright `.structra` file-chooser import; desktop smoke now proves real `.structra` external-open paths are read by the frontend, native Open picker reads a `.structra`, native Save As writes a `.structra`, native JSON/SVG/PNG/PDF export pickers write valid files, Recent ordering persists after restart, workspace Recent reopen works, and unsaved prompts are emitted through audit evidence. SVG/PNG/PDF pixel/visual export baselines are still unproven end to end.
- Tauri read/write commands reject relative paths and unsupported extensions. Current Rust unit coverage asserts the command-level path validation plus `.structra`/`.png` temp-file round trips; desktop smoke now proves dialog-selected paths pass native Open, Save As, JSON export, SVG export, PNG export, current-page PDF export, document PDF export, workspace Recent reopen, and unsaved-prompt audit loops.
- The packaged app uses a non-null production CSP that permits only local app, Tauri IPC, data/blob images, and local workers; `pnpm tauri:build` verifies the config is accepted by the release bundle path.
- Corrupt or unsupported files show actionable in-app errors and do not destroy the current document. Initial corrupt JSON smoke coverage and Mermaid unsupported/corrupt fixture coverage exist.
- localStorage cache is treated as recovery data, not the primary product file model.

### P0.3 Persistent Regression Test Suite

Problem: the app has many behaviors but no committed regression harness.

Required work:

- Add Playwright smoke tests for core user flows.
- Add deterministic test fixtures for JSON/Mermaid/SVG/PNG/PDF export where possible. Initial Mermaid unsupported/corrupt fixtures, SVG escaping coverage, and native SVG/PNG/PDF picker file-validity checks exist; SVG/PNG/PDF pixel/visual baselines remain open.
- Add a fast unit-test runner script for domain helpers and import/export normalization. Initial `scripts/qa/unit-tests.mjs` is exposed through `pnpm test` and `pnpm test:unit`.
- Add CI-ready scripts even if CI is not yet configured.

Acceptance criteria:

- `pnpm test` runs fast unit tests for extracted modules.
- `pnpm test:e2e` starts the app and runs the browser smoke test through the existing Playwright harness.
- E2E covers: create node, connect nodes, edit labels, apply template, export SVG, import JSON, undo/redo, multi-page switch, and ER/UML semantic rendering.
- Tests are committed under stable test paths, not only temporary `output/playwright` scripts.
- A fresh checkout can run `pnpm build` plus the documented test commands without manual browser scripting.

### P0.4 Editor Core Interaction Quality

Problem: broad editing exists, but product-grade diagramming depends on precision and repeatable interaction quality.

Required work:

- Harden multi-select, drag, resize, rotate, snap, align/distribute, grouping, locking, z-order, and layer behavior.
- Add stable connector anchor behavior and predictable reconnection.
- Improve orthogonal routing so it handles common obstacle layouts and user edits.
- Add contextual mini-toolbar or right-click actions for high-frequency operations.
- Ensure keyboard shortcuts do not conflict with text editing.
- Keep page creation, duplication, rename, delete, reorder, and template application on the landed document-level command transaction path.

Acceptance criteria:

- Users can create a 30-node flowchart with branches, labels, groups, and comments without losing selection state or corrupting edges.
- Connectors stay attached after node move, resize, and group movement.
- Undo/redo covers node creation, text edits, style edits, route edits, grouping, page operations, and import/template application.
- Move history toward document-level transactions rather than current-page snapshots. Initial `src/editor/history.ts` exists, App undo/redo now uses document-level `HistoryEntry`, `src/editor/commands.ts` has landed for page/template operations, inline label commits, active-page graph replacements used by element editing, React Flow drag/resize commits, connect/reconnect, and edge waypoint/bend commits, plus active-page snapshot replacements used by clipboard and comment mutations. Smoke coverage verifies push/dedupe/undo/redo/redo truncation plus command helper behavior and page creation undo/redo.
- Locked nodes cannot be moved, edited, deleted, grouped, or restyled through any visible control. The pure operation layer now skips locked nodes for property patches, format painter node patches, label commits, duplicate, group/ungroup, align/distribute, auto-layout, z-order, and layer movement, while still allowing explicit lock/unlock controls.
- E2E test covers a realistic 10-step editing workflow with assertions on graph state and exported SVG.

### P0.5 Product-Grade Diagram Semantics

Problem: BPMN/UML/ER support is currently visual/partial. A ProcessOn-like tool must support common user expectations for each diagram family.

Required work:

- Flowchart: complete common flowchart symbols and connector presets. Initial connector presets now cover flow arrows, UML/ER association, bidirectional, inheritance, aggregation, and composition; SVG export preserves semantic inheritance/aggregation/composition markers.
- BPMN: expand event/task/gateway variants and pools/lanes enough for common approval/business workflows.
- UML: class diagrams with attributes/methods, associations, inheritance, aggregation/composition labels.
- ER: entity fields, PK/FK, relationship cardinalities, and editable relationship labels.
- Mind map/org chart: dedicated local node families now exist for mind topics/branches and org people/units, with initial toolbar and command-palette layout commands plus single and batch semantic inspector controls. Remaining work is deeper layout options and end-to-end family-specific authoring tests.

Acceptance criteria:

- Shape library exposes a searchable category for each diagram family. Initial dedicated `mind` and `org` categories now exist alongside BPMN/UML/ER.
- Each P0 diagram family has at least 3 realistic built-in templates.
- SVG export preserves the visual semantics for fields, compartments, badges, cardinality, arrowheads, labels, dedicated mind topic/branch shapes, and org person cards.
- Inspectors expose semantic fields directly rather than requiring users to encode everything in free text. UML, ER, swimlane, table, mind, and org fields exist, including batch semantic edits for all-mind and all-org selections.
- Applying a template produces a diagram that can be edited without special-case breakage.

### P0.6 Import/Export Reliability

Problem: export exists, but product workflows need predictable fidelity and compatibility boundaries.

Required work:

- Define supported import/export matrix and mark unsupported formats explicitly.
- Preserve all local document data in JSON project export/import.
- Add fixture-based round-trip tests. Initial rich `.structra` coverage exists for multi-page documents, settings, BPMN/ER/table/mind semantic fields, comment replies, hidden graph filtering, and visible JSON/Mermaid/SVG exports; `.structra` fixture parsing and Playwright import coverage also exist.
- Improve Mermaid support or clearly scope it to common flowchart syntax.
- Keep SVG export in a dedicated module with module-level smoke coverage for hidden filtering, edge paths, table cells, swimlane labels, and XML escaping. Initial `src/io/svgExport.ts` and browser smoke assertions exist.
- Expose the supported-format matrix in the document inspector so local users can see native, best-effort, and unsupported boundaries before relying on import/export. Initial `src/domain/formatSupport.ts` and inspector UI exist for `.structra`, `.structra`, JSON, Mermaid, SVG, PNG, PDF, Visio/VSDX, XMind, and Excel/CSV.
- Investigate Visio-compatible import/export as a later P1/P2 item, not a silent P0 promise.

Acceptance criteria:

- JSON/document round-trip preserves pages, settings, nodes, edges, semantic fields, comments, versions where applicable, and custom styles. Initial `.structra` fixture coverage plus `.structra` fixture parsing exist; broader fixture variety remains open.
- SVG/PNG/PDF export includes all visible nodes/edges and excludes hidden layers. Initial SVG/Mermaid/JSON assertions exist for a rich fixture; PNG/PDF visual baselines remain open.
- Exported files use document/page names safely as filenames.
- Importing unsupported Mermaid syntax fails with a clear message. Initial unsupported and corrupt Mermaid fixtures cover this boundary.
- User-facing UI states which formats are native, best-effort, and unsupported. Initial inspector matrix and smoke coverage are in place.

### P0.7 Desktop Product Polish

Problem: the app can run in Tauri, but desktop product behavior is incomplete.

Required work:

- Add app-level error boundaries and recoverable failure states.
- Add start screen or document picker for New/Open/Recent. Initial local workspace overlay exists with New/Open/Recent entry points, template search, template categories, favorite templates, local/built-in template counts, URL-backed editor/workspace mode, refresh-stable editor entry, and editor return.
- Add update-ready app metadata, icons, bundle naming, and platform-specific menu behavior.
- Add app preferences for grid, snap, autosave, theme, default export format. Initial local preferences now cover grid, rulers, snap, page preset, background, recovery autosave, startup workspace, light/dark/system theme, and default export format.
- Add accessibility pass for keyboard navigation and labeled controls.

Acceptance criteria:

- App starts to a product-grade document entry state when no file is open. Initial local workspace entry state, return-to-workspace, and refresh-stable editor state are covered by browser smoke; deeper native file lifecycle failures remain open.
- Menus and shortcuts match visible commands and disabled states.
- Native menu commands are verified for New, Open, Save, Save As, Export, Undo, Redo, Cut, Copy, Paste, Delete, Select All, presentation/preview actions where present, and disabled states when a command cannot run. Unit coverage now checks the enabled-state model and dispatch guard including audit-only desktop commands; desktop smoke verifies initial Save-disabled synchronization through the packaged Tauri menu-state command, native dispatch/guard behavior, native workspace return, selection/copy/paste state transitions, dirty/save state transitions, restarted workspace Recent reopen, unsaved-prompt audit, and native Open/Save As/JSON/SVG/PNG/PDF export picker commands through real native menu clicks. Rendered OS menu inspection and SVG/PNG/PDF pixel/visual baselines remain.
- App errors do not white-screen the editor; recoverable errors show actionable UI.
- macOS app bundle builds successfully with `pnpm tauri:build` or documented equivalent.
- Desktop smoke test covers app launch, open/save, menu command, and export.

### P0.8 Performance Baseline

Problem: there is no current evidence that large diagrams remain usable.

Required work:

- Establish performance fixtures for 100, 500, and 1000 nodes. Synthetic fixtures exist in `scripts/qa/performance-baseline.mjs`, and interactive fixtures exist in `tests/performance/interactive-performance.js`.
- Measure load, pan/zoom, selection, export, and undo/redo. `pnpm qa:perf` now measures JSON stringify/parse, SVG export, render-ready, outline-driven selection, zoom, pan, single-node drag move, area selection, undo, and redo.
- Optimize rendering or state updates where fixtures fail.

Acceptance criteria:

- 100-node diagrams feel interactive during pan/zoom and selection.
- 500-node diagrams remain usable for navigation and editing selected nodes.
- SVG export for 500 nodes completes within an agreed threshold on the target Mac.
- Performance test results are repeatable through `pnpm qa:perf`; current guardrail thresholds are documented in the interactive performance script and latest measurements are recorded in `docs/product/local-verification-log.md`.
- The benchmark report records load, pan, zoom, drag selection, single selection, undo, redo, JSON round-trip, and SVG export timings for 100, 500, and 1000 node fixtures.
- Each benchmark has a documented target Mac profile, threshold, measured result, date, and pass/fail status so regressions can be compared across releases.

## P1 Gaps

P1 means needed for strong ProcessOn-like competitiveness after the local desktop P0 is solid.

- Larger template library with more categories, preview thumbnails, and local template folders. Search, favorites, and custom template persistence now exist locally; the remaining competitive gap is breadth and organization depth, not cloud marketplace behavior.
- More shape libraries: network/infrastructure, UI wireframe, icons, database architecture, electrical/engineering basics.
- Advanced auto-layout: tree, DAG, mind map, org chart, swimlane-aware layout.
- Connector presets: straight, elbow, orthogonal avoid, curve, no arrow, bidirectional, association, inheritance, aggregation, composition.
- Advanced style system: reusable styles, document palettes, format painter improvements, default style presets, and richer per-document theme packs beyond the current app light/dark/system theme.
- Rich text editing inside nodes with lists, line spacing, mixed emphasis, and better text wrapping.
- Better comments/review workflow for local use: comment filters, unresolved count by page, export comments report.
- Better presentation/export: multi-page presentation ordering, page transitions, export notes, print settings.
- Plugin/extensibility seam for custom shapes and templates without editing app code.
- Optional Git-friendly handoff workflow: export change-friendly JSON, compare versions, package diagrams for review.

## P2 Gaps

P2 means useful for long-term local desktop parity, but not required for the local-first product baseline.

- AI diagram generation, AI layout suggestions, AI text-to-flowchart, and AI template expansion if they can run without changing the local-first product model.
- Visio import/export if feasible through a local library or explicit local conversion workflow.
- XMind/Excel/POS import compatibility if strategically important.
- Local template and shape package management.
- Cross-platform signed releases, auto-updater, crash reporting, and opt-in local diagnostics.

## Recommended Execution Plan

### Phase 1: Stabilize The Product Core

Goal: stop prototype sprawl and create a testable product foundation.

Deliverables:

- P0.1 modular architecture.
- P0.3 persistent regression suite.
- Initial P0.8 performance fixtures.

Exit criteria:

- `App.tsx` is no longer the implementation hub.
- `docs/product/local-desktop-acceptance-checklist.md` has passing or explicitly deferred entries for App split, command/history seams, and performance baseline.
- Build and regression tests pass from a fresh checkout.
- Current demo capabilities remain intact.

### Phase 2: Make It A Real Desktop Document App

Goal: replace browser-app persistence with desktop product semantics.

Deliverables:

- P0.2 real local file model.
- P0.7 desktop product polish.
- JSON schema and migration path.

Exit criteria:

- Users can manage real local files confidently.
- Autosave/recovery is separate from intentional save.
- Native menus, shortcuts, recent files, and dirty state behave predictably.
- The local desktop acceptance checklist passes for native file lifecycle, native menu, and local recent documents without adding accounts, sharing, cloud storage, or collaboration features.

### Phase 3: Deepen Editor And Diagram Families

Goal: move from broad demo coverage to reliable ProcessOn-like authoring.

Deliverables:

- P0.4 editor core interaction quality.
- P0.5 product-grade diagram semantics.
- P0.6 import/export reliability.

Exit criteria:

- A realistic business process, UML class model, ER model, org chart, and mind map can be created, edited, exported, reopened, and presented without manual repair.

### Phase 4: Expand Competitive Breadth

Goal: fill P1 library/template/layout gaps once the core is stable.

Deliverables:

- Template and shape expansion.
- Advanced layout and connector presets.
- Better style/theme system.
- Local review and presentation improvements.

Exit criteria:

- The app feels like a focused local desktop alternative to ProcessOn for single-user diagram authoring, not a web prototype inside a desktop shell.

## Non-Goals For Current P0

- No account system.
- No cloud backend.
- No real-time multiplayer.
- No cloud sharing permissions.
- No online marketplace.
- No telemetry requirement.

These can be revisited only after the local desktop file/editor baseline is complete.
