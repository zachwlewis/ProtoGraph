import { connectPins, createNode, makeGraph, replaceGraphState } from "../../editor/model/graphMutations";
import { DEFAULT_EXPORT_PREFS } from "../../editor/model/types";
import { exportGraphToPng } from "../../export/exportPng";
import { loadLibraryFromStorage, saveLibraryToStorage } from "../../persistence/storage";

describe("PR3 workflow", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    window.localStorage.clear();

    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();

    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: vi.fn(() => makeMockCanvasContext())
    });

    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      value: vi.fn((callback: (blob: Blob | null) => void) => callback(new Blob(["ok"])))
    });

    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      // no-op in tests
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it("supports create -> connect -> save -> load -> export flow", () => {
    const graph = makeGraph();
    const [withA, a] = createNode(graph, { x: 0, y: 0, title: "A" });
    const [withB, b] = createNode(withA, { x: 300, y: 0, title: "B" });

    const connection = connectPins(withB, withB.nodes[a].outputPinIds[0], withB.nodes[b].inputPinIds[0]);
    expect(connection.success).toBe(true);

    saveLibraryToStorage({
      version: 2,
      activeGraphId: "graph_1",
      order: ["graph_1"],
      settings: {
        navigationMode: "mouse",
        resolvedNavigationMode: "mouse"
      },
      graphs: {
        graph_1: {
          id: "graph_1",
          name: "Workflow",
          updatedAt: Date.now(),
          graph: connection.graph,
          exportPrefs: { ...DEFAULT_EXPORT_PREFS },
          themePresetId: "midnight"
        }
      }
    });
    const loaded = loadLibraryFromStorage();
    expect(loaded).toBeTruthy();

    const restored = replaceGraphState(makeGraph(), loaded!.graphs[loaded!.activeGraphId].graph);
    expect(restored.order.length).toBe(2);
    expect(restored.edgeOrder.length).toBe(1);

    exportGraphToPng(restored, "viewport", { width: 1200, height: 700 });

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });
});

function makeMockCanvasContext(): CanvasRenderingContext2D {
  const noop = vi.fn();
  return {
    scale: noop,
    fillRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    bezierCurveTo: noop,
    arc: noop,
    fill: noop,
    fillText: noop,
    measureText: vi.fn((text: string) => ({ width: text.length * 7 } as TextMetrics)),
    arcTo: noop,
    closePath: noop,
    set fillStyle(_value: string | CanvasGradient | CanvasPattern) {},
    get fillStyle() {
      return "#000";
    },
    set strokeStyle(_value: string | CanvasGradient | CanvasPattern) {},
    get strokeStyle() {
      return "#000";
    },
    set lineWidth(_value: number) {},
    get lineWidth() {
      return 1;
    },
    set textBaseline(_value: CanvasTextBaseline) {},
    get textBaseline() {
      return "alphabetic" as CanvasTextBaseline;
    },
    set font(_value: string) {},
    get font() {
      return "12px sans-serif";
    }
  } as unknown as CanvasRenderingContext2D;
}
