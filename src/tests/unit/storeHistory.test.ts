import { makeGraph } from "../../editor/model/graphMutations";
import type { GraphModel } from "../../editor/model/types";
import { useGraphStore } from "../../editor/store/useGraphStore";

function graphFromState(state: ReturnType<typeof useGraphStore.getState>): GraphModel {
  return {
    nodes: state.nodes,
    pins: state.pins,
    edges: state.edges,
    order: state.order,
    edgeOrder: state.edgeOrder,
    selectedNodeIds: state.selectedNodeIds,
    selectedEdgeIds: state.selectedEdgeIds,
    viewport: state.viewport,
    singleInputPolicy: state.singleInputPolicy,
    allowSameNodeConnections: state.allowSameNodeConnections
  };
}

describe("store history", () => {
  let seq = 0;
  let graphId = "";

  beforeEach(() => {
    seq += 1;
    graphId = `history_test_${seq}`;
    useGraphStore.getState().activateGraphContext(graphId, makeGraph(), true);
  });

  it("undoes and redoes basic node creation", () => {
    const store = useGraphStore.getState();
    const nodeId = store.addNodeAt(100, 120, "Node");

    expect(useGraphStore.getState().nodes[nodeId]).toBeDefined();
    expect(useGraphStore.getState().canUndo).toBe(true);

    store.undo();
    expect(useGraphStore.getState().nodes[nodeId]).toBeUndefined();
    expect(useGraphStore.getState().canRedo).toBe(true);

    store.redo();
    expect(useGraphStore.getState().nodes[nodeId]).toBeDefined();
  });

  it("undoes and redoes node creation from presets", () => {
    const store = useGraphStore.getState();
    const nodeId = store.addNodeFromPresetAt(120, 140, "math.add");

    expect(nodeId).toBeTruthy();
    expect(useGraphStore.getState().nodes[nodeId]).toBeDefined();
    expect(useGraphStore.getState().canUndo).toBe(true);

    store.undo();
    expect(useGraphStore.getState().nodes[nodeId]).toBeUndefined();

    store.redo();
    expect(useGraphStore.getState().nodes[nodeId]).toBeDefined();
  });

  it("undoes and redoes successful pin connections", () => {
    const store = useGraphStore.getState();
    const a = store.addNodeAt(0, 0, "A");
    const b = store.addNodeAt(280, 20, "B");
    const state = useGraphStore.getState();

    const fromPin = state.nodes[a].outputPinIds[0];
    const toPin = state.nodes[b].inputPinIds[0];
    const result = store.connectPins(fromPin, toPin);

    expect(result.success).toBe(true);
    expect(useGraphStore.getState().edgeOrder).toHaveLength(1);

    store.undo();
    expect(useGraphStore.getState().edgeOrder).toHaveLength(0);

    store.redo();
    expect(useGraphStore.getState().edgeOrder).toHaveLength(1);
  });

  it("does not track non-content operations in history", () => {
    const store = useGraphStore.getState();
    store.panBy(32, 18);
    store.setSingleInputPolicy(false);
    store.setAllowSameNodeConnections(true);

    const state = useGraphStore.getState();
    expect(state.viewport.x).toBe(32);
    expect(state.viewport.y).toBe(18);
    expect(state.singleInputPolicy).toBe(false);
    expect(state.allowSameNodeConnections).toBe(true);
    expect(state.canUndo).toBe(false);
  });

  it("coalesces node drag-like moves into one undo step via transaction", () => {
    const store = useGraphStore.getState();
    const a = store.addNodeAt(40, 50, "A");
    const b = store.addNodeAt(240, 50, "B");
    store.setSelection([a, b]);

    store.activateGraphContext(graphId, graphFromState(useGraphStore.getState()), true);
    store.setSelection([a, b]);
    const beforeA = useGraphStore.getState().nodes[a].x;
    const beforeB = useGraphStore.getState().nodes[b].x;

    store.beginHistoryTransaction();
    store.moveSelectionBy(10, 0);
    store.moveSelectionBy(14, 0);
    store.endHistoryTransaction();

    expect(useGraphStore.getState().nodes[a].x).toBe(beforeA + 24);
    expect(useGraphStore.getState().nodes[b].x).toBe(beforeB + 24);

    store.undo();
    expect(useGraphStore.getState().nodes[a].x).toBe(beforeA);
    expect(useGraphStore.getState().nodes[b].x).toBe(beforeB);
  });

  it("coalesces pin reorder drags into one undo step via transaction", () => {
    const store = useGraphStore.getState();
    const nodeId = store.addNodeAt(20, 20, "Node");
    store.addPin(nodeId, "input", "A");
    store.addPin(nodeId, "input", "B");
    store.addPin(nodeId, "input", "C");

    store.activateGraphContext(graphId, graphFromState(useGraphStore.getState()), true);
    const before = useGraphStore.getState().nodes[nodeId].inputPinIds.slice();

    store.beginHistoryTransaction();
    store.reorderPin(nodeId, "input", 0, 2);
    store.reorderPin(nodeId, "input", 2, 1);
    store.endHistoryTransaction();

    const moved = useGraphStore.getState().nodes[nodeId].inputPinIds;
    expect(moved).not.toEqual(before);

    store.undo();
    expect(useGraphStore.getState().nodes[nodeId].inputPinIds).toEqual(before);
  });

  it("clears redo stack after a new edit", () => {
    const store = useGraphStore.getState();
    store.addNodeAt(100, 100, "One");
    store.undo();
    expect(useGraphStore.getState().canRedo).toBe(true);

    store.addNodeAt(140, 160, "Two");
    expect(useGraphStore.getState().canRedo).toBe(false);
  });

  it("keeps history isolated per graph context", () => {
    const store = useGraphStore.getState();
    const g1Id = `g1_${seq}`;
    const g2Id = `g2_${seq}`;

    store.activateGraphContext(g1Id, makeGraph(), true);
    store.addNodeAt(10, 10, "Graph1");
    const g1Graph = graphFromState(useGraphStore.getState());
    expect(useGraphStore.getState().canUndo).toBe(true);

    store.activateGraphContext(g2Id, makeGraph(), true);
    expect(useGraphStore.getState().canUndo).toBe(false);
    store.addNodeAt(30, 40, "Graph2");
    const g2Graph = graphFromState(useGraphStore.getState());
    expect(useGraphStore.getState().canUndo).toBe(true);

    store.activateGraphContext(g1Id, g1Graph, false);
    expect(useGraphStore.getState().canUndo).toBe(true);

    store.undo();
    expect(useGraphStore.getState().order).toHaveLength(0);

    store.activateGraphContext(g2Id, g2Graph, false);
    expect(useGraphStore.getState().order).toHaveLength(1);
  });

  it("enforces per-graph history cap of 100 steps", () => {
    const store = useGraphStore.getState();
    for (let i = 0; i < 105; i += 1) {
      store.addNodeAt(10 + i * 8, 20, `N${i}`);
    }
    expect(useGraphStore.getState().order).toHaveLength(105);

    for (let i = 0; i < 100; i += 1) {
      store.undo();
    }
    expect(useGraphStore.getState().order).toHaveLength(5);

    store.undo();
    store.undo();
    expect(useGraphStore.getState().order).toHaveLength(5);
  });
});
