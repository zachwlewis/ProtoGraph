import { coreNodePack } from "./packs/core.pack";
import { logicNodePack } from "./packs/logic.pack";
import { mathNodePack } from "./packs/math.pack";
import type { NodePack, NodePreset } from "./types";

export const nodePacks: NodePack[] = [coreNodePack, mathNodePack, logicNodePack];

export type IndexedNodePreset = {
  packId: string;
  preset: NodePreset;
};

export const nodePresetIndex: Record<string, IndexedNodePreset> = buildNodePresetIndex(nodePacks);

function buildNodePresetIndex(packs: NodePack[]): Record<string, IndexedNodePreset> {
  const index: Record<string, IndexedNodePreset> = {};

  for (const pack of packs) {
    for (const preset of pack.presets) {
      if (index[preset.id]) {
        throw new Error(`Duplicate node preset id: ${preset.id}`);
      }
      index[preset.id] = {
        packId: pack.id,
        preset
      };
    }
  }

  return index;
}

export const __testables = {
  buildNodePresetIndex
};
