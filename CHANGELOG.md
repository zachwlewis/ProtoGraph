# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-02-22

### Added
- PR1 foundation:
  - Infinite canvas with pan/zoom grid.
  - Node creation, selection, drag, delete, duplicate.
- PR2 graph construction:
  - Input/output pins and SVG wire connections.
  - Wire preview, selection, and delete.
  - User-facing graph rules for single-input policy and same-node connections.
- PR3 practical workflow:
  - Autosave/restore via localStorage.
  - JSON save/load.
  - PNG export: viewport, full graph, and framed variant.
  - PWA manifest and service worker for offline baseline.
  - Shared layout tokens used across editor/export paths.

### Improved
- Visual polish pass:
  - Edge-mounted pins and denser node body spacing.
  - Crisp neutral editor wires and stronger selection styling.
  - Neon orange selected-node treatment.
  - Framed export with transparent outside area and dedicated `ngsketch-framed.png` filename.

### Fixed
- Resolved React store update loop in canvas rendering path.
- Removed accidental stacked initial-node behavior on reload.
- Corrected export/editor visual mismatches in fonts, pin placement, and spacing.
