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

## Core Shortcuts
- `Delete` / `Backspace`: delete selected node/edge
- `Ctrl/Cmd + D`: duplicate selected node(s)
- `Space + Drag`: pan canvas
- `Mouse Wheel`: zoom at cursor

## Known Limitations
- Node/pin text editing is not implemented yet (titles and pin labels are currently fixed by creation/mutation flows).
- No marquee selection/alignment helpers yet.
- Selected wire glow uses browser-dependent SVG filter rendering and may look slightly different between browsers.
