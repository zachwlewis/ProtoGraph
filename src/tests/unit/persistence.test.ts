import { createNode, makeGraph } from "../../editor/model/graphMutations";
import {
  clearStoredGraph,
  loadGraphFromStorage,
  loadNavigationSettings,
  saveGraphToStorage,
  saveNavigationSettings
} from "../../persistence/storage";

describe("persistence storage", () => {
  beforeEach(() => {
    clearStoredGraph();
    window.localStorage.clear();
  });

  it("saves and loads graph snapshots from localStorage", () => {
    const graph = makeGraph();
    const [withNode] = createNode(graph, { x: 42, y: 84, title: "Persisted" });

    saveGraphToStorage(withNode);
    const loaded = loadGraphFromStorage();

    expect(loaded).toBeTruthy();
    expect(loaded?.order.length).toBe(1);
    const node = loaded?.nodes[loaded.order[0]];
    expect(node?.title).toBe("Persisted");
    expect(node?.x).toBe(42);
    expect(node?.y).toBe(84);
  });

  it("returns null when storage is empty or corrupted", () => {
    expect(loadGraphFromStorage()).toBeNull();

    window.localStorage.setItem("ngsketch.graph.v1", "{bad-json");
    expect(loadGraphFromStorage()).toBeNull();
  });

  it("clears stored graph", () => {
    const graph = makeGraph();
    const [withNode] = createNode(graph, { x: 0, y: 0 });

    saveGraphToStorage(withNode);
    expect(loadGraphFromStorage()).toBeTruthy();

    clearStoredGraph();
    expect(loadGraphFromStorage()).toBeNull();
  });

  it("saves and loads navigation settings", () => {
    saveNavigationSettings({
      navigationMode: "trackpad",
      resolvedNavigationMode: "trackpad"
    });

    expect(loadNavigationSettings()).toEqual({
      navigationMode: "trackpad",
      resolvedNavigationMode: "trackpad"
    });
  });

  it("returns null for missing or invalid navigation settings", () => {
    expect(loadNavigationSettings()).toBeNull();
    window.localStorage.setItem(
      "ngsketch.nav-settings.v1",
      JSON.stringify({ navigationMode: "auto", resolvedNavigationMode: null })
    );
    expect(loadNavigationSettings()).toBeNull();
    window.localStorage.setItem("ngsketch.nav-settings.v1", "{oops");
    expect(loadNavigationSettings()).toBeNull();
  });
});
