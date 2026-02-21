# Node Graph Mockup Web App - Implementation Backlog

## Project Goal
Build a fully client-side web app for quickly mocking up node graphs (Blueprints/Shader Graph style) for screenshots and sharing.  
No server-side code. Must work offline.

## Product Scope
- In scope:
  - Infinite canvas with pan/zoom
  - Create/edit/delete nodes
  - Create/edit/delete pins (inputs/outputs)
  - Connect nodes with wires
  - Visual customization for mockup fidelity
  - Local persistence and JSON import/export
  - Screenshot export (PNG), optional SVG export
  - Offline use via PWA app-shell caching
- Out of scope:
  - Graph execution/runtime semantics
  - Collaboration/multi-user sync
  - Authentication/backend storage

## Tech Decisions
- Framework: React + TypeScript + Vite
- State: Zustand + Immer (or equivalent immutable helpers)
- Rendering:
  - Nodes: HTML/CSS layer
  - Wires: SVG overlay (Bezier curves)
- Persistence:
  - localStorage for autosave and named drafts (MVP)
  - JSON file import/export
- Offline:
  - Vite PWA plugin or handcrafted service worker
- Tests:
  - Unit: Vitest
  - Interaction/E2E: Playwright (or Cypress)

## Proposed File Structure
```text
ngsketch/
  docs/
    node-graph-mockup-backlog.md
  public/
    icons/
    manifest.webmanifest
  src/
    app/
      App.tsx
      routes.tsx
    editor/
      canvas/
        InfiniteCanvas.tsx
        GridBackground.tsx
        ViewportControls.ts
      graph/
        GraphRoot.tsx
        NodeLayer.tsx
        EdgeLayer.tsx
      components/
        NodeCard.tsx
        PinView.tsx
        EdgePath.tsx
        SelectionBox.tsx
      panels/
        Toolbar.tsx
        PalettePanel.tsx
        InspectorPanel.tsx
      hooks/
        useCanvasInput.ts
        useNodeDrag.ts
        useWireConnect.ts
        useSelection.ts
      model/
        types.ts
        schema.ts
        graphMutations.ts
        graphSelectors.ts
      store/
        useGraphStore.ts
      utils/
        geometry.ts
        bezier.ts
        ids.ts
        hotkeys.ts
      styles/
        tokens.css
        app.css
        node-theme.css
    persistence/
      autosave.ts
      storage.ts
      io.ts
    export/
      exportPng.ts
      exportSvg.ts
    pwa/
      serviceWorker.ts
      registerSW.ts
    tests/
      unit/
        graphMutations.test.ts
        geometry.test.ts
      e2e/
        editor-basic.spec.ts
        connect-wires.spec.ts
    main.tsx
    vite-env.d.ts
  index.html
  package.json
  tsconfig.json
  vite.config.ts
```

## Graph Data Model (MVP)
```ts
type Graph = {
  nodes: Record<string, NodeModel>;
  pins: Record<string, PinModel>;
  edges: Record<string, EdgeModel>;
  viewport: Viewport;
  selection: SelectionState;
  metadata: GraphMetadata;
};

type NodeModel = {
  id: string;
  title: string;
  subtitle?: string;
  x: number;
  y: number;
  width: number;
  collapsed?: boolean;
  style: NodeStyle;
  inputPinIds: string[];
  outputPinIds: string[];
};

type PinModel = {
  id: string;
  nodeId: string;
  direction: "input" | "output";
  label: string;
  type: string;
  color: string;
  shape: "circle" | "diamond" | "square";
};

type EdgeModel = {
  id: string;
  fromPinId: string; // output
  toPinId: string;   // input
  style: EdgeStyle;
};
```

## Priority Backlog (Epics and Stories)
### Epic A: Editor Foundation
- A1: Bootstrap Vite React TS app, lint/test baseline
- A2: Infinite canvas with pan/zoom and grid
- A3: Core graph store and model schema
- A4: Basic node rendering and dragging

### Epic B: Graph Construction
- B1: Pin rendering with in/out layout
- B2: Wire creation via drag from output to input
- B3: Edge selection and deletion
- B4: Marquee selection + multi-node move

### Epic C: Speed of Mockup
- C1: Quick add node (double-click, context menu, hotkey)
- C2: Inspector edits for title, colors, pin labels/types
- C3: Duplicate, copy/paste, align helpers, snap toggle
- C4: Node style presets (Blueprint-like, Shader-like)

### Epic D: Persistence and Export
- D1: Autosave and restore last graph
- D2: Save/load JSON files
- D3: PNG export (viewport and full graph bounds)
- D4: Optional SVG export

### Epic E: Offline/PWA and Polish
- E1: Manifest and service worker for offline app shell
- E2: Keyboard shortcut map and discoverability
- E3: Performance pass for large mockups (500+ nodes)
- E4: Visual polish and screenshot/presentation mode

## First 3 PR-Sized Milestones

## PR 1 - Editor Skeleton + Node MVP
### Objective
Deliver a runnable app where users can pan/zoom an infinite canvas, create basic nodes, move them, and delete them.

### Scope
- Project bootstrap (Vite + React + TS)
- App shell layout:
  - Top toolbar placeholder
  - Left palette placeholder
  - Main canvas area
- Infinite canvas:
  - Pan (middle mouse / space+drag)
  - Zoom (wheel centered at cursor)
  - Grid background
- Graph store:
  - In-memory graph model
  - Node CRUD actions
  - Selection state
- Node component:
  - Title bar + body shell
  - Drag-to-move
  - Selected state styling
- Keyboard:
  - Delete selected node
  - Duplicate selected node

### Acceptance Criteria
- App runs with `npm run dev`.
- User can create a node via button or double-click.
- User can drag nodes smoothly while canvas pan/zoom remains stable.
- Deleting and duplicating selected node works.
- Basic unit tests pass for node create/delete/duplicate mutations.

### Suggested Branch
- `codex/pr1-editor-skeleton-node-mvp`

## PR 2 - Pins + Wire Connections
### Objective
Enable realistic graph construction by adding pins and connectable wires.

### Scope
- Pin model and pin rendering on node left/right rails
- Node inspector controls for adding/removing pins
- Wire layer (SVG):
  - Bezier path rendering
  - Hover/selected states
- Connect interaction:
  - Drag from output pin to input pin
  - Preview wire while dragging
  - Validation rules:
    - Output -> input only
    - No self-loop on same pin
    - Single input policy toggle (default true)
- Delete selected wire

### Acceptance Criteria
- User can add labeled input/output pins to any node.
- User can connect compatible pins with a visible wire.
- Invalid target pin is rejected with clear visual feedback.
- Wire selection and deletion works.
- Interaction test verifies connect/disconnect flow.

### Suggested Branch
- `codex/pr2-pins-and-wires`

## PR 3 - Mockup Speed + Persistence + Export
### Objective
Make the tool practical for real usage: fast editing, local save, and screenshot output.

### Scope
- Inspector panel:
  - Edit node title/subtitle
  - Edit pin label/type/color/shape
  - Node color/style tokens
- Quick workflows:
  - Context menu add node
  - Copy/paste selection
  - Multi-select + box select
- Persistence:
  - Autosave to localStorage
  - Manual JSON import/export
- Export:
  - PNG export of viewport
  - PNG export of full graph bounds
- PWA baseline:
  - Manifest + cached app shell for offline launch

### Acceptance Criteria
- Reloading page restores last working graph.
- User can export/import graph JSON and retain layout.
- User can export PNG and get a clean screenshot-ready image.
- App opens and works with network disabled after first load.
- E2E test covers create -> connect -> save -> reload -> export path.

### Suggested Branch
- `codex/pr3-speed-persistence-export`

## Definition of Done (MVP)
- All PR1-PR3 acceptance criteria are met.
- No backend dependency exists.
- Works on Chromium and Firefox desktop.
- Keyboard-first core actions are documented.
- README includes quickstart, shortcuts, and export notes.

## Risks and Mitigations
- Risk: Coordinate bugs with zoomed drag/edge routing.
  - Mitigation: Centralize world/screen transform utilities + tests.
- Risk: Export mismatch vs visible canvas styling.
  - Mitigation: Snapshot export from same DOM/SVG layers used for editing.
- Risk: Performance degradation on dense graphs.
  - Mitigation: Memoized selectors, virtualization guardrails, throttled pointer handlers.

## Immediate Next Actions
1. Initialize project scaffold and tooling.
2. Implement PR1 scope end-to-end.
3. Add CI workflow running lint, unit tests, and build.
