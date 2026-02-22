# PR8 Plan: UX/Style Simplification and Control Reorganization

## Summary
Restructure the app UI to maximize canvas space and simplify controls while preserving node/wire visuals and right-sidebar workflows.

Key outcomes:
1. Keep node and wire visual styling unchanged.
2. Reduce grid/background contrast.
3. Unify non-canvas control typography to `13px`.
4. Replace high-frequency text actions with Google iconography (Material Symbols Outlined).
5. Remove the left sidebar and replace it with a bottom-left floating icon dock + single popover panel:
   - Settings (navigation mode only)
   - Graph properties (graph rules + graph theme)
   - Graph info (graph name, duplicate, delete w/ inline confirm, JSON export)
6. Move graph switching + new graph + JSON import to top nav.
7. Keep right sidebar, but convert Layout controls to icon grid (always visible, contextually enabled).
8. Improve right sidebar node editor UX:
   - Visually group Inputs and Outputs
   - “Add input/output” buttons at each group bottom
   - Reorder pins via drag handle on the left edge (handle-only drag)
9. Add `?` help icon in top nav opening a modal with implemented controls/hotkeys only.

## Locked Decisions
1. Icons: `Material Symbols Outlined`.
2. Floating hub behavior: single popover panel switching by selected dock icon.
3. Reorder interaction: handle-only drag reorder, within input group or output group only.
4. Unified control font size: `13px`.
5. Graph selection in top nav: dropdown selector.
6. Delete confirmation: inline confirm/cancel in Graph Info panel.
7. Right sidebar remains; only left sidebar is removed.
8. Help modal includes only currently implemented controls/hotkeys.

## Public API / Interface / Type Changes
### 1. Graph mutation/store additions (pin reorder)
Add to `src/editor/model/graphMutations.ts` and `src/editor/store/useGraphStore.ts`:
- `reorderPinInNode(nodeId: string, direction: PinDirection, fromIndex: number, toIndex: number): GraphModel`
- Store action: `reorderPin(nodeId, direction, fromIndex, toIndex): void`

Behavior:
- Reorders only `inputPinIds` or only `outputPinIds`.
- No cross-direction moves.
- No-op on invalid indices.
- Preserves pin ids, edges, and labels.

### 2. UI state additions in `App.tsx`
Add local UI state:
- `floatingHubOpen: boolean`
- `floatingHubSection: "settings" | "properties" | "info"`
- `graphDeleteConfirm: boolean`
- `helpModalOpen: boolean`

### 3. Icon system
Add Material Symbols stylesheet import in `src/main.tsx` (or `index.html`) plus icon utility class:
- `.icon-button`
- `.material-symbols-outlined`

Implementation default:
- Use Google icon font family, with `aria-label` and tooltip/title on icon-only buttons.

### 4. Layout controls UI contract
Replace text buttons with icon grid in right panel:
- Align: left/center-x/right/top/center-y/bottom
- Distribute: horizontal/vertical

Enablement rules:
- Align enabled when `selectedNodeIds.length >= 2`
- Distribute enabled when `selectedNodeIds.length >= 3`
- Buttons always rendered, disabled when unavailable.

## Implementation Plan
### Phase 1: Structural layout refactor
1. Remove left sidebar markup and CSS (`.left-panel` usage in `App.tsx`).
2. Expand main shell to toolbar + canvas + right sidebar.
3. Add bottom-left floating dock with 3 icon buttons:
   - `settings`, `tune` (properties), `info`
4. Add single floating panel above dock that swaps content by section.
5. Keep right sidebar mounted for Layout + Node editing.

### Phase 2: Top toolbar reorganization
1. Move graph management controls to toolbar:
   - Graph dropdown selector (active graph shown)
   - New graph button (icon + tooltip)
   - JSON import button next to New graph
2. Keep Export dropdown in toolbar, but remove JSON export from it.
3. Add `?` icon button in toolbar to open Help modal.

### Phase 3: Floating panel content mapping
1. Settings section:
   - Navigation mode selector only.
2. Graph properties section:
   - Graph rules toggles (single-input, allow same-node)
   - Theme preset selector
3. Graph info section:
   - Graph name edit
   - Duplicate graph action
   - Delete action with inline confirm/cancel
   - JSON export action

### Phase 4: Right sidebar UX update
1. Layout area:
   - Replace text buttons with icon grid.
   - Apply contextual disabled states.
2. Node area:
   - Group UI into Inputs and Outputs cards/sections.
   - Each section has list + bottom “add pin” button.
   - Add left-edge drag handle per pin row.
   - Handle drag reorders within section (input-only / output-only).
   - Preserve existing inline label editing behavior.

### Phase 5: Styling pass
1. Reduce grid contrast:
   - Lower `--grid` alpha in theme presets and fallback CSS.
2. Unify non-canvas typography:
   - Set `13px` baseline for toolbar, popovers, modal, sidebar controls.
3. Icon-first treatment:
   - Convert obvious repetitive text actions to icon buttons.
   - Keep concise text where required for form fields and destructive confirmations.
4. Ensure no changes to node/wire style tokens or geometry.

### Phase 6: Help modal
1. Add modal component with:
   - Navigation controls (mouse/trackpad mode behavior)
   - Selection/edit controls
   - Existing keyboard shortcuts (Delete/Backspace, Cmd/Ctrl+D, Space+drag, etc.)
2. Modal accessibility:
   - ESC to close
   - Focus trap
   - Backdrop click closes

## Test Plan
### Unit tests
1. `graphMutations`:
   - `reorderPinInNode` happy path and boundary no-op cases.
   - Ensure edge connectivity preserved after reorder.
2. `App` helpers:
   - Delete confirmation state behavior for graph info action.

### UI tests (Testing Library)
1. Toolbar graph selector changes active graph.
2. Floating dock opens panel and switches sections.
3. Graph info delete inline confirm requires confirm click to delete.
4. Layout icon buttons:
   - always rendered
   - enabled/disabled by selection count.
5. Pin reorder:
   - dragging handle updates order within group.
6. Help modal open/close + content sections present.

### Visual/manual checks
1. Canvas area increased (left sidebar removed).
2. Grid contrast visibly reduced.
3. Non-canvas controls read at consistent 13px scale.
4. Icon controls show proper tooltip/aria labels.
5. Node/wire visuals remain unchanged.

## Acceptance Criteria
1. Left sidebar is removed; bottom-left dock + popover provides settings/properties/info.
2. Top nav contains graph selector, new graph, JSON import, and help icon.
3. JSON export is accessible from Graph Info.
4. Right sidebar layout controls are icon grid and context-aware enabled.
5. Node pin lists are grouped and reorderable via left-edge drag handles.
6. Grid contrast is reduced; control font size is unified to 13px.
7. Node and wire visuals are unchanged.
8. Help modal accurately lists implemented controls/hotkeys only.

## Assumptions and Defaults
1. Material Symbols Outlined icons will be used throughout icon-first controls.
2. Icon-only controls will include tooltip/title + `aria-label`.
3. Pin reorder is constrained to same-direction list (input/output), no cross-group moves.
4. Existing right sidebar remains; only left sidebar is removed.
5. Delete confirmation is inline (non-modal) in Graph Info panel.
6. Export behavior from PR7 remains (single PNG button, frame checkbox controls framed/unframed output).
