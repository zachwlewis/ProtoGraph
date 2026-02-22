# PR9: Undo/Redo for Core Graph Edits

## Summary
Add undo/redo for core graph content editing, with per-graph session-only history and gesture-level coalescing.

## Locked Decisions
- Scope: core graph edits only.
- Exclusions: settings, graph library management, viewport, and selection-only changes.
- History lifetime: per graph, session-only (not persisted).
- Drag/reorder granularity: one step per gesture.
- UI: keyboard shortcuts and toolbar buttons.
- History depth: 100 snapshots per graph.

## Included Undoable Operations
- Create node.
- Delete selected nodes/edges.
- Duplicate selected nodes.
- Move selected nodes.
- Connect pins (successful connects only).
- Add pin.
- Remove pin.
- Reorder pins.
- Rename node.
- Rename pin.
- Align selection.
- Distribute selection.

## Implementation Shape
- Extend `useGraphStore` with:
  - `undo`, `redo`, `canUndo`, `canRedo`.
  - `beginHistoryTransaction`, `endHistoryTransaction`.
  - `activateGraphContext(graphId, graph, resetHistory?)`.
  - `clearGraphHistory(graphId)`.
- Keep history in memory only, keyed by graph id.
- Store content snapshots only: `{nodes,pins,edges,order,edgeOrder}`.
- Restore content snapshots while preserving non-scoped state (viewport, rules/settings, selection sanitized against existing ids).

## App/Canvas Wiring
- Use `activateGraphContext` when loading/switching/replacing active graph context.
- Clear deleted graph history with `clearGraphHistory`.
- Add toolbar undo/redo buttons with disabled states.
- Add shortcuts:
  - `Cmd/Ctrl+Z` => undo
  - `Shift+Cmd/Ctrl+Z` => redo
  - `Ctrl+Y` => redo
- Wrap node drag and pin reorder drags in history transactions.
- Coalesce multi-field inspector commit-on-selection-change into one transaction.

## Tests
- Add store-level undo/redo tests:
  - create/delete/duplicate/connect/rename/align/distribute undo+redo.
  - redo invalidation on new edit.
  - non-scoped ops do not create history.
  - transaction coalescing for move/reorder.
  - per-graph history isolation.
  - history cap enforcement.

## Acceptance
- Core graph edits are undoable/redoable as listed.
- Drag-like edits undo in a single step.
- History is per graph in-session only.
- Toolbar+shortcuts are functional and blocked while typing in form fields.
