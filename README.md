# ngsketch

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

## Core Shortcuts
- `Delete` / `Backspace`: delete selected node/edge
- `Ctrl/Cmd + D`: duplicate selected node(s)
- `Space + Drag`: pan canvas
- `Mouse Wheel`: zoom at cursor
