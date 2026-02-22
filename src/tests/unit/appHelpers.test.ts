import type { SavedGraph } from "../../editor/model/types";
import { __testables } from "../../App";

describe("app helpers", () => {
  it("picks most recently updated graph id", () => {
    const graphs: Record<string, SavedGraph> = {
      a: {
        id: "a",
        name: "A",
        updatedAt: 10,
        graph: {
          nodes: {},
          pins: {},
          edges: {},
          order: [],
          edgeOrder: [],
          selectedNodeIds: [],
          selectedEdgeIds: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          singleInputPolicy: true,
          allowSameNodeConnections: false
        },
        exportPrefs: { scale: 2, margin: 60, includeFrame: false, frameTitle: "x" },
        themePresetId: "midnight"
      },
      b: {
        id: "b",
        name: "B",
        updatedAt: 25,
        graph: {
          nodes: {},
          pins: {},
          edges: {},
          order: [],
          edgeOrder: [],
          selectedNodeIds: [],
          selectedEdgeIds: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          singleInputPolicy: true,
          allowSameNodeConnections: false
        },
        exportPrefs: { scale: 2, margin: 60, includeFrame: false, frameTitle: "x" },
        themePresetId: "midnight"
      }
    };

    expect(__testables.pickMostRecentlyUpdatedGraphId(["a", "b"], graphs)).toBe("b");
  });

  it("sanitizes graph names for export filenames", () => {
    expect(__testables.toFilenameBase("  My Cool Graph  ")).toBe("My Cool Graph");
    expect(__testables.toFilenameBase('A:B/C*D?"E<F>G|')).toBe("A B C D E F G");
    expect(__testables.toFilenameBase("   ")).toBe("ngsketch-graph");
  });
});
