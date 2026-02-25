# ProtoGraph

Offline-first web app for quickly mocking up node graph screenshots.

## Current Features

- Infinite canvas with pan/zoom and grid
- Node graph editing:
  - Add nodes from toolbar or double-click
  - Drag, multi-select, marquee select
  - Connect wires, select/delete edges
  - Inline node title + pin label editing
  - Pin add/remove/reorder from inspector
- Layout helpers:
  - Align left/center/right/top/middle/bottom
  - Distribute horizontally/vertically
- Per-graph rules and preferences:
  - Single-input connection policy
  - Allow/disallow same-node connections
  - Per-graph export settings and theme preset
- Multi-graph local library:
  - Create/switch/duplicate/delete graphs
  - Per-graph autosave in localStorage
  - JSON import creates a new graph entry and preserves metadata when present (name/theme/export prefs)
  - JSON export for active graph includes graph metadata (name/theme/export prefs)
- Export:
  - PNG viewport
  - PNG full graph
  - PNG framed (transparent outside frame)
- Themes:
  - midnight, blueprint, slate, blender
- Undo/redo for core graph edits:
  - Per-graph, session-only history
  - Drag/reorder gesture coalescing
  - Toolbar buttons and keyboard shortcuts
- Offline baseline:
  - PWA manifest + service worker app-shell caching

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
```

## Developer Docs

- Node presets and pack authoring: `docs/node-preset-packs.md`

## GitHub Pages Deployment

- Repository must be public for GitHub Pages on GitHub Free.
- Deployment is handled by `.github/workflows/deploy-pages.yml`.
- Workflow triggers on pushes to `main` and on manual dispatch.
- CI runs `npm ci`, `npm test`, and `npm run build -- --base=/${{ github.event.repository.name }}/` before deploy.
- In GitHub repo settings, set Pages source to `GitHub Actions`.
- Expected project-site URL pattern: `https://<owner>.github.io/ProtoGraph/`.
- First publish can take a few minutes after the workflow succeeds.
- Base path is derived from repository name in CI so project-path hosting stays correct after repo transfer/fork/rename.

## Verify First Live Deploy

1. Push `main` and confirm `Deploy to GitHub Pages` workflow succeeds.
2. Open `https://<owner>.github.io/ProtoGraph/`.
3. Confirm there are no 404s for JS/CSS/manifest/service worker in browser devtools.
4. Confirm the service worker scope is under `/ProtoGraph/`.
5. Do a hard refresh, then test one offline reload.
6. If an old service worker is still active, clear site data once and re-test.

## Core Shortcuts

- `Cmd/Ctrl + Z`: undo
- `Shift + Cmd/Ctrl + Z` or `Ctrl + Y`: redo
- `Delete` / `Backspace`: delete selected node/edge
- `Ctrl/Cmd + D`: duplicate selected node(s)
- `Shift + Click`: toggle node in selection
- `Space + Drag`: pan fallback
- Mouse mode: `Mouse Wheel` zoom, right-drag pan
- Trackpad mode: two-finger pan, pinch zoom

## Known Limitations

- Data is local-only (no sync/collaboration/server backend).
- Undo/redo is session-only and scoped to core graph content edits (graph library operations, app settings, and viewport changes are excluded).
- Service worker updates may require one hard refresh or clearing site data when switching between old/new cached versions.
