import { createNode, makeGraph } from "../../editor/model/graphMutations";
import {
  clearStoredLibrary,
  loadLibraryFromStorage,
  saveLibraryToStorage
} from "../../persistence/storage";
import { DEFAULT_EXPORT_PREFS } from "../../editor/model/types";

describe("persistence storage", () => {
  beforeEach(() => {
    clearStoredLibrary();
    window.localStorage.clear();
  });

  it("saves and loads graph library snapshots from localStorage", () => {
    const graph = makeGraph();
    const [withNode] = createNode(graph, { x: 42, y: 84, title: "Persisted" });
    const library = {
      version: 2 as const,
      activeGraphId: "graph_1",
      order: ["graph_1"],
      settings: {
        navigationMode: "mouse" as const,
        resolvedNavigationMode: "mouse" as const
      },
      graphs: {
        graph_1: {
          id: "graph_1",
          name: "Persisted",
          updatedAt: 1,
          graph: withNode,
          exportPrefs: { ...DEFAULT_EXPORT_PREFS },
          themePresetId: "midnight" as const
        }
      }
    };

    saveLibraryToStorage(library);
    const loaded = loadLibraryFromStorage();

    expect(loaded).toBeTruthy();
    expect(loaded?.order).toEqual(["graph_1"]);
    const node = loaded?.graphs.graph_1.graph.nodes[loaded.graphs.graph_1.graph.order[0]];
    expect(node?.title).toBe("Persisted");
    expect(node?.x).toBe(42);
    expect(node?.y).toBe(84);
  });

  it("returns null when library storage is empty or corrupted", () => {
    expect(loadLibraryFromStorage()).toBeNull();

    window.localStorage.setItem("protograph.library.v2", "{bad-json");
    expect(loadLibraryFromStorage()).toBeNull();
  });

  it("clears stored library", () => {
    const graph = makeGraph();
    const [withNode] = createNode(graph, { x: 0, y: 0 });
    const library = {
      version: 2 as const,
      activeGraphId: "graph_1",
      order: ["graph_1"],
      settings: {
        navigationMode: "trackpad" as const,
        resolvedNavigationMode: "trackpad" as const
      },
      graphs: {
        graph_1: {
          id: "graph_1",
          name: "A",
          updatedAt: 1,
          graph: withNode,
          exportPrefs: { ...DEFAULT_EXPORT_PREFS },
          themePresetId: "midnight" as const
        }
      }
    };

    saveLibraryToStorage(library);
    expect(loadLibraryFromStorage()).toBeTruthy();

    clearStoredLibrary();
    expect(loadLibraryFromStorage()).toBeNull();
  });

  it("supports loading an empty library snapshot", () => {
    saveLibraryToStorage({
      version: 2,
      activeGraphId: null,
      order: [],
      settings: {
        navigationMode: "auto",
        resolvedNavigationMode: null
      },
      graphs: {}
    });

    const loaded = loadLibraryFromStorage();
    expect(loaded).toBeTruthy();
    expect(loaded?.activeGraphId).toBeNull();
    expect(loaded?.order).toEqual([]);
  });

  it("rejects a library snapshot with missing active graph id target", () => {
    window.localStorage.setItem(
      "protograph.library.v2",
      JSON.stringify({
        version: 2,
        activeGraphId: "missing",
        order: [],
        settings: {
          navigationMode: "auto",
          resolvedNavigationMode: null
        },
        graphs: {}
      })
    );

    expect(loadLibraryFromStorage()).toBeNull();
  });
});
