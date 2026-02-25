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
    expect(__testables.toFilenameBase("   ")).toBe("ProtoGraph-graph");
  });

  it("resolves imported graph metadata with fallbacks", () => {
    expect(
      __testables.resolveImportedGraphMeta(
        {
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
          name: null,
          themePresetId: null,
          exportPrefs: null
        },
        "My Import.json"
      )
    ).toEqual({
      name: "My Import",
      themePresetId: "midnight",
      exportPrefs: {
        scale: 2,
        margin: 60,
        includeFrame: false,
        frameTitle: "ProtoGraph mockup"
      }
    });

    expect(
      __testables.resolveImportedGraphMeta(
        {
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
          name: "Imported Name",
          themePresetId: "slate",
          exportPrefs: { scale: 3, margin: 24, includeFrame: true, frameTitle: "Demo" }
        },
        "ignored.json"
      )
    ).toEqual({
      name: "Imported Name",
      themePresetId: "slate",
      exportPrefs: { scale: 3, margin: 24, includeFrame: true, frameTitle: "Demo" }
    });
  });
});
