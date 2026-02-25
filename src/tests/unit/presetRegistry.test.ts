import { __testables, nodePacks, nodePresetIndex } from "../../editor/presets/registry";
import type { NodePack } from "../../editor/presets/types";

describe("preset registry", () => {
  it("indexes all presets from all packs", () => {
    const totalPresetCount = nodePacks.reduce((count, pack) => count + pack.presets.length, 0);
    expect(Object.keys(nodePresetIndex)).toHaveLength(totalPresetCount);

    for (const pack of nodePacks) {
      for (const preset of pack.presets) {
        expect(nodePresetIndex[preset.id]?.packId).toBe(pack.id);
      }
    }
  });

  it("throws when duplicate preset ids are present", () => {
    const duplicatePacks: NodePack[] = [
      {
        id: "a",
        label: "A",
        presets: [{ id: "dup.id", title: "One", pins: [] }]
      },
      {
        id: "b",
        label: "B",
        presets: [{ id: "dup.id", title: "Two", pins: [] }]
      }
    ];

    expect(() => __testables.buildNodePresetIndex(duplicatePacks)).toThrow("Duplicate node preset id: dup.id");
  });
});
