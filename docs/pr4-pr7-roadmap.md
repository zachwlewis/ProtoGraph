# PR4-PR7 Roadmap: Navigation, Multi-Graph Library, Editing, Layout Tools, Export Controls, Theme Presets (No Legacy Migration)

## Summary
Implement the next feature set in four priority-ordered PRs:

1. PR4: Navigation improvements + condensed toolbar/export menu  
2. PR5: Multiple saved graphs (local library, no legacy storage migration)  
3. PR6: Inline title/pin editing + marquee multi-select + align/distribute  
4. PR7: Advanced export controls + graph-wide theme presets

## Locked Product Decisions
1. PR slicing: 4 PRs.
2. Navigation default: auto-detect.
3. Auto-detect strategy: first real gesture wins, with user override in settings.
4. Trackpad behavior: Space+drag and touchpad scroll-pan; pinch zoom.
5. Graph library model: single active graph + saved graph list.
6. JSON import behavior: creates a new saved graph entry.
7. Deleting active graph: auto-switch to most recently edited remaining graph; create blank if none remain.
8. Inline editing: double-click entry, plus inspector editing support.
9. Selection/layout tools: align + distribute in scope.
10. Export defaults persistence: per-graph.
11. Theme presets: graph-wide only.
12. Storage migration: explicitly out of scope (replace storage format directly).
13. Theme preset list includes blender.

## PR4: Navigation + Condensed Toolbar

### Scope
1. Add navigation setting: Auto, Mouse, Trackpad.
2. Implement mode-specific controls.
3. Condense toolbar actions into a dropdown-style Export menu.

### Behavior Spec
1. Mouse mode:
- Wheel = zoom at cursor.
- Right-click + drag = pan.
- Disable context menu while actively right-drag panning.
2. Trackpad mode:
- Wheel/scroll events pan canvas.
- Pinch (wheel with ctrlKey/meta gesture signal) zooms at cursor.
- Space + left-drag pans as explicit fallback.
3. Auto mode:
- Starts unresolved.
- First meaningful gesture resolves mode and persists.
- User can manually override anytime in settings.
4. Toolbar condensation:
- Replace multiple export buttons with one Export dropdown.
- Menu contains: PNG Viewport, PNG Full, PNG Framed, Download JSON, Load JSON.

### Interfaces / Type Changes
1. Add settings types:
- `type NavigationMode = "auto" | "mouse" | "trackpad"`
- `type ResolvedNavigationMode = "mouse" | "trackpad" | null`
2. Add app settings persistence:
- navigationMode
- resolvedNavigationMode

### Tests
1. Unit: gesture classifier resolves auto mode correctly.
2. Unit: mouse mode wheel zoom and right-drag pan dispatch correct actions.
3. Unit: trackpad wheel pan vs pinch zoom discrimination.
4. Integration: export dropdown actions trigger same handlers as old buttons.

## PR5: Multi-Graph Local Library (No Migration)

### Scope
1. Replace single-graph localStorage model with graph library model.
2. Add UI for graph management: new, select, rename, duplicate, delete.
3. Keep per-graph graph rules and per-graph export defaults.

### Behavior Spec
1. Graph list panel shows saved graphs by name + modified time.
2. Actions:
- New Graph creates blank graph named Untitled N and activates it.
- Rename inline rename in list.
- Duplicate clones active graph and appends Copy.
- Delete removes graph; if active, switch to most recently edited remaining graph; create blank graph if none left.
3. Autosave writes only active graph entry.
4. Import JSON creates a new graph entry and activates it.
5. No storage migration logic: loader reads only new library format; old key ignored.

### Interfaces / Type Changes
1. New persistence types:
- `type SavedGraph = { id: string; name: string; updatedAt: number; graph: GraphModel; exportPrefs: ExportPrefs; themePresetId: ThemePresetId }`
- `type GraphLibrary = { version: 2; activeGraphId: string; graphs: Record<string, SavedGraph>; order: string[]; settings: AppSettings }`
2. New canonical storage key only:
- `protograph.library.v2`

### Tests
1. CRUD: new/select/rename/duplicate/delete logic.
2. Active delete fallback behavior.
3. Import creates new graph entry (does not overwrite active).
4. Save/load round-trip for full library format.

## PR6: Inline Editing + Marquee + Align/Distribute

### Scope
1. Inline node title edit (double-click).
2. Inline pin label edit (double-click input/output labels).
3. Keep inspector editing support for same fields.
4. Add marquee selection and layout tools.

### Behavior Spec
1. Inline editing:
- Double-click title/label enters edit mode.
- Enter saves.
- Esc cancels.
- Blur saves.
- Empty value trims; if empty after trim, revert to previous value.
2. Inspector:
- Selected node title editable via input.
- Pin label editable via inputs for selected node pins.
3. Marquee:
- Click-drag empty canvas creates selection rectangle.
- Selects nodes whose bounds intersect marquee.
- Shift adds to selection.
4. Align/distribute controls:
- Align: left, center-x, right, top, center-y, bottom.
- Distribute: horizontal and vertical (requires 3+ selected nodes).
- Edge connectivity preserved by node movement.

### Interfaces / Type Changes
1. Graph mutations:
- `renameNode(nodeId, title)`
- `renamePin(pinId, label)`
- `setSelectionByMarquee(rect, mode)`
- `alignSelection(kind)`
- `distributeSelection(axis)`

### Tests
1. Unit: rename node/pin validation and no-op handling.
2. Unit: marquee intersection logic.
3. Unit: align/distribute geometry results.
4. Integration: inline edit keyboard flow (Enter/Esc/blur).

## PR7: Export Controls + Theme Presets

### Scope
1. Add export controls: scale, margin, include frame toggle.
2. Persist export defaults per graph.
3. Add graph-wide theme presets.

### Behavior Spec
1. Export settings UI:
- Scale (1x, 1.5x, 2x, 3x)
- Margin (px)
- Include frame (boolean)
2. Export dropdown uses current graph’s export defaults.
3. Export filenames:
- ProtoGraph-viewport.png
- ProtoGraph-full.png
- ProtoGraph-framed.png when frame enabled
  - Note: Include graph name in export filenames in PR7 (format TBD).
  - Note: Do not auto-use graph name as framed title; framed title behavior will be specified separately in PR7.
4. Theme presets:
- Apply to entire graph canvas/nodes/wires/text.
- Preset selection stored with graph.
- No per-node overrides in this phase.
- Include presets: midnight, blueprint, slate, blender.

### Interfaces / Type Changes
1. `type ExportPrefs = { scale: number; margin: number; includeFrame: boolean; frameTitle: string }`
2. `type ThemePresetId = "midnight" | "blueprint" | "slate" | "blender"`
3. Shared token pipeline for editor + exporter parity.

### Tests
1. Unit: export bounds calculation with variable margin/scale.
2. Unit: framed/unframed transparency behavior remains correct.
3. Integration: changing export prefs updates subsequent export output mode/filename.
4. Unit: theme preset application maps to both editor CSS vars and exporter palette.

## Cross-Cutting Implementation Notes
1. Keep editor/export visual parity through shared token maps.
2. Keep Zustand selectors primitive/memoized to avoid render churn.
3. Keep accessibility basics for inline edit fields and dropdown menus (keyboard navigation/focus behavior).

## Acceptance Criteria (Final)
1. User can switch navigation mode and auto mode learns first gesture.
2. User can manage multiple local graphs without data loss.
3. User can edit node titles and pin labels inline and via inspector.
4. User can marquee-select nodes and run align/distribute actions.
5. User can configure export scale/margin/frame per graph.
6. User can apply graph-wide visual presets, including Blender-inspired preset.

## Assumptions and Defaults
1. Two-finger click/drag is not implemented literally due browser event limitations; touchpad scroll-pan is the reliable substitute.
2. Auto-format graph is deferred beyond PR7 and tracked as backlog.
3. Theme presets are graph-wide only in this phase.
4. Export settings are stored per graph, not globally.
5. Inline edits trim whitespace and reject empty final values by reverting to prior text.
6. Legacy single-graph storage key is intentionally not migrated.
