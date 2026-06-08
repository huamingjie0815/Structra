# Playwright Smoke QA

This smoke check turns the ad hoc Playwright UI verification flow into a repeatable gate for the local-first single-user React/Tauri diagram editor.

## Scope

The smoke verifies the minimum editor path that should stay stable while ProcessOn-level features are added:

- the app opens and renders the main workspace
- a built-in template can be applied
- basic nodes can be created from the shape library
- a basic edge can be created between two nodes
- JSON export includes the current local document
- SVG export includes key node labels and an edge path
- the current document can be saved to local cache and restored after reload
- a local JSON diagram fixture can be imported
- the local document name is visible and edits surface an unsaved state

Out of scope: accounts, cloud sync, multiplayer collaboration, shared links, and sharing permissions.

## Run

```bash
pnpm qa:smoke
```

The runner starts Vite on `http://127.0.0.1:1424`, opens an isolated Playwright CLI session, executes `tests/smoke/playwright-smoke.js`, then stops the dev server and closes the session.

To override the port:

```bash
QA_SMOKE_PORT=1430 pnpm qa:smoke
```

## Prerequisites

- `pnpm`
- `npx`
- Codex Playwright CLI wrapper at `$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh`

The wrapper path can be overridden:

```bash
PWCLI=/path/to/playwright_cli.sh pnpm qa:smoke
```

## Artifacts

The Vite log is written to:

```text
output/playwright/playwright-smoke-vite.log
```

The smoke captures JSON and SVG content in the browser before download, so it does not leave generated export files behind. The Playwright CLI wrapper still writes its normal snapshots and console logs under `.playwright-cli/`.
