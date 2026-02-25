# Node Preset Packs (Developer Guide)

This document explains how to add new node presets and node packs for ProtoGraph.

## Where It Lives

- Preset types: `src/editor/presets/types.ts`
- Pack files: `src/editor/presets/packs/*.pack.ts`
- Registry: `src/editor/presets/registry.ts`
- Graph creation from preset: `src/editor/model/graphMutations.ts` (`createNodeFromPreset`)
- Store action for UI placement: `src/editor/store/useGraphStore.ts` (`addNodeFromPresetAt`)
- Picker UI: `src/editor/components/NodePicker.tsx`

## Preset Data Model

```ts
type PinPreset = {
  label: string;
  direction: "input" | "output";
  type?: string;
  color?: string;
  shape?: "circle" | "diamond" | "square";
};

type NodePreset = {
  id: string;
  title: string;
  width?: number;
  pins: PinPreset[];
  tags?: string[];
  category?: string;
};

type NodePack = {
  id: string;
  label: string;
  description?: string;
  presets: NodePreset[];
};
```

## Add A New Preset To An Existing Pack

1. Open a pack file in `src/editor/presets/packs/`.
2. Add a new `NodePreset` object to `presets`.
3. Use a globally unique `id` (recommended: `<packId>.<name>`).

Example:

```ts
{
  id: "math.clamp",
  title: "Clamp",
  category: "Scalar",
  tags: ["limit", "range"],
  pins: [
    { label: "Value", direction: "input", type: "Float" },
    { label: "Min", direction: "input", type: "Float" },
    { label: "Max", direction: "input", type: "Float" },
    { label: "Result", direction: "output", type: "Float" }
  ]
}
```

## Add A New Pack File

1. Create `src/editor/presets/packs/<name>.pack.ts`.
2. Export a `NodePack` constant.
3. Import and add it to `nodePacks` in `src/editor/presets/registry.ts`.

Template:

```ts
import type { NodePack } from "../types";

export const audioNodePack: NodePack = {
  id: "audio",
  label: "Audio",
  description: "Audio graph utilities.",
  presets: [
    {
      id: "audio.volume",
      title: "Volume",
      category: "Mix",
      tags: ["gain"],
      pins: [
        { label: "In", direction: "input", type: "Audio" },
        { label: "Gain", direction: "input", type: "Float" },
        { label: "Out", direction: "output", type: "Audio" }
      ]
    }
  ]
};
```

Then in `src/editor/presets/registry.ts`:

```ts
import { audioNodePack } from "./packs/audio.pack";

export const nodePacks: NodePack[] = [coreNodePack, mathNodePack, logicNodePack, audioNodePack];
```

## Required Conventions

- `preset.id` must be globally unique across all packs.
- `pins` order matters:
  - input pins are rendered in the order provided,
  - output pins are rendered in the order provided.
- Use stable IDs; changing IDs breaks picker references and tests.

The registry throws on duplicate IDs at module init:

```ts
throw new Error(`Duplicate node preset id: ${preset.id}`);
```

## Pin Defaults

If `type`, `color`, or `shape` are omitted in a `PinPreset`, defaults are applied in `makePin`:

- Input pin defaults:
  - `type: "Any In"`
  - `color: "#58c4ff"`
  - `shape: "circle"`
- Output pin defaults:
  - `type: "Any Out"`
  - `color: "#ffb655"`
  - `shape: "circle"`

## Placement + Interaction Behavior

- Double-click canvas: creates a default `"Node"` via `addNodeAt`.
- Right-click canvas (mouse and trackpad): opens node picker.
- Right-drag in mouse mode: pans (click/drag threshold split).
- Drag from a pin and release on canvas: opens picker; chosen preset is created and auto-connected.

Auto-connect rules after picker selection:

- If source pin is `output`: connect source output -> new node first input.
- If source pin is `input`: connect new node first output -> source input.

## Validation Checklist

Before committing new presets/packs:

1. Run `npm test`.
2. Confirm no duplicate preset IDs.
3. Manually open picker and verify:
   - search returns the new node,
   - category/pack grouping is correct,
   - node creates with expected pins and title.
4. If pin drag-to-canvas matters for the new node, verify auto-connect succeeds.

## Troubleshooting

- "Node preset not found":
  - Ensure pack is exported and included in `nodePacks`.
  - Ensure `preset.id` is spelled exactly as used.
- "Created node, but no compatible pin was available":
  - Your preset has no input pins (for output-source connect) or no output pins (for input-source connect).
- Connection failure after picker selection:
  - Check graph rules (`singleInputPolicy`, `allowSameNodeConnections`) and pin directions.
