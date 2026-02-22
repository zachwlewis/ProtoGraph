# ProtoGraph

Offline-first web app for quickly mocking up node graph screenshots.

## Current Features

- Infinite canvas with pan/zoom and grid
- Add node from toolbar or double-click
- Drag/select nodes
- Node pins (inputs/outputs), edge connections, edge selection/delete
- Graph rules:
  - Single input connection policy
  - Allow/disallow same-node connections
- Inspector pin controls:
  - Add input/output pins
  - Remove pins
- Persistence:
  - Autosave to localStorage
  - Restore previous draft on reload
  - Save JSON / Load JSON
- Export:
  - PNG viewport
  - PNG full graph
  - PNG framed (transparent outside frame)
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

- `Delete` / `Backspace`: delete selected node/edge
- `Ctrl/Cmd + D`: duplicate selected node(s)
- `Space + Drag`: pan canvas
- `Mouse Wheel`: zoom at cursor

## Known Limitations

- Node/pin text editing is not implemented yet (titles and pin labels are currently fixed by creation/mutation flows).
- No marquee selection/alignment helpers yet.
- Selected wire glow uses browser-dependent SVG filter rendering and may look slightly different between browsers.
