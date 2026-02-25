import { create } from "zustand";
import type {
  AlignKind,
  ConnectResult,
  DistributeAxis,
  SelectionMode,
  WorldRect
} from "../model/graphMutations";
import type { GraphModel, PinDirection } from "../model/types";
import {
  alignSelection,
  addPinToNode,
  clearSelection,
  connectPins,
  createNode,
  createNodeFromPreset,
  deleteSelection,
  distributeSelection,
  duplicateSelectedNodes,
  makeGraph,
  moveSelectedNodesBy,
  panViewportBy,
  renameNode,
  renamePin,
  replaceGraphState,
  removePin,
  reorderPinInNode,
  setSelectionByMarquee,
  setSelectedEdges,
  setSelectedNodes,
  setSingleInputPolicy,
  setAllowSameNodeConnections,
  setViewport,
  zoomAtScreenPoint
} from "../model/graphMutations";
import { nodePresetIndex } from "../presets/registry";

type GraphContentSnapshot = Pick<GraphModel, "nodes" | "pins" | "edges" | "order" | "edgeOrder">;

type GraphHistoryState = {
  canUndo: boolean;
  canRedo: boolean;
};

type GraphActions = {
  addNodeAt: (x: number, y: number, title?: string) => string;
  addNodeFromPresetAt: (x: number, y: number, presetId: string, titleOverride?: string) => string;
  addPin: (nodeId: string, direction: PinDirection, label?: string) => string | null;
  removePin: (pinId: string) => void;
  reorderPin: (nodeId: string, direction: PinDirection, fromIndex: number, toIndex: number) => void;
  renameNode: (nodeId: string, title: string) => void;
  renamePin: (pinId: string, label: string) => void;
  connectPins: (fromPinId: string, toPinId: string) => ConnectResult;
  setSelection: (ids: string[]) => void;
  setSelectionByMarquee: (rect: WorldRect, mode?: SelectionMode) => void;
  setEdgeSelection: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  moveSelectionBy: (dx: number, dy: number) => void;
  alignSelection: (kind: AlignKind) => void;
  distributeSelection: (axis: DistributeAxis) => void;
  panBy: (dx: number, dy: number) => void;
  setViewport: (next: GraphModel["viewport"]) => void;
  zoomAt: (screenX: number, screenY: number, delta: number) => void;
  setSingleInputPolicy: (value: boolean) => void;
  setAllowSameNodeConnections: (value: boolean) => void;
  replaceGraph: (graph: GraphModel) => void;
  undo: () => void;
  redo: () => void;
  beginHistoryTransaction: () => void;
  endHistoryTransaction: () => void;
  activateGraphContext: (graphId: string, graph: GraphModel, resetHistory?: boolean) => void;
  clearGraphHistory: (graphId: string) => void;
};

type GraphHistoryEntry = {
  past: GraphContentSnapshot[];
  future: GraphContentSnapshot[];
  transactionDepth: number;
  transactionBefore: GraphContentSnapshot | null;
};

const HISTORY_LIMIT = 100;
const DEFAULT_GRAPH_CONTEXT_ID = "__default_graph__";

export const useGraphStore = create<GraphModel & GraphHistoryState & GraphActions>((set, get) => {
  const historyByGraph = new Map<string, GraphHistoryEntry>();
  let activeGraphContextId = DEFAULT_GRAPH_CONTEXT_ID;

  const toGraph = (state: GraphModel & GraphHistoryState & GraphActions): GraphModel => ({
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
  });

  const snapshotContent = (graph: GraphModel): GraphContentSnapshot => ({
    nodes: graph.nodes,
    pins: graph.pins,
    edges: graph.edges,
    order: graph.order,
    edgeOrder: graph.edgeOrder
  });

  const hasContentChanged = (a: GraphContentSnapshot, b: GraphContentSnapshot): boolean =>
    a.nodes !== b.nodes ||
    a.pins !== b.pins ||
    a.edges !== b.edges ||
    a.order !== b.order ||
    a.edgeOrder !== b.edgeOrder;

  const makeEmptyHistory = (): GraphHistoryEntry => ({
    past: [],
    future: [],
    transactionDepth: 0,
    transactionBefore: null
  });

  const ensureHistory = (graphId: string): GraphHistoryEntry => {
    const existing = historyByGraph.get(graphId);
    if (existing) {
      return existing;
    }
    const created = makeEmptyHistory();
    historyByGraph.set(graphId, created);
    return created;
  };

  const trimStack = (stack: GraphContentSnapshot[]) => {
    if (stack.length <= HISTORY_LIMIT) {
      return;
    }
    stack.splice(0, stack.length - HISTORY_LIMIT);
  };

  const withHistoryFlags = (entry: GraphHistoryEntry): GraphHistoryState => ({
    canUndo: entry.past.length > 0,
    canRedo: entry.future.length > 0
  });

  const sanitizeSelection = (
    graph: GraphModel,
    snapshot: GraphContentSnapshot
  ): Pick<GraphModel, "selectedNodeIds" | "selectedEdgeIds"> => {
    const selectedNodeIds = graph.selectedNodeIds.filter((nodeId) => Boolean(snapshot.nodes[nodeId]));
    const selectedEdgeIds = selectedNodeIds.length
      ? []
      : graph.selectedEdgeIds.filter((edgeId) => Boolean(snapshot.edges[edgeId]));
    return { selectedNodeIds, selectedEdgeIds };
  };

  const restoreContent = (graph: GraphModel, snapshot: GraphContentSnapshot): GraphModel => {
    const selection = sanitizeSelection(graph, snapshot);
    return {
      ...graph,
      nodes: snapshot.nodes,
      pins: snapshot.pins,
      edges: snapshot.edges,
      order: snapshot.order,
      edgeOrder: snapshot.edgeOrder,
      ...selection
    };
  };

  const setGraphWithFlags = (graph: GraphModel, entry: GraphHistoryEntry) => {
    set({
      ...graph,
      ...withHistoryFlags(entry)
    });
  };

  const applyNonUndoable = (mutate: (graph: GraphModel) => GraphModel) => {
    const current = toGraph(get());
    const next = mutate(current);
    const entry = ensureHistory(activeGraphContextId);
    setGraphWithFlags(next, entry);
  };

  const applyUndoable = (mutate: (graph: GraphModel) => GraphModel) => {
    const current = toGraph(get());
    const currentSnapshot = snapshotContent(current);
    const next = mutate(current);
    const nextSnapshot = snapshotContent(next);
    if (!hasContentChanged(currentSnapshot, nextSnapshot)) {
      return;
    }

    const entry = ensureHistory(activeGraphContextId);

    if (entry.transactionDepth > 0) {
      setGraphWithFlags(next, entry);
      return;
    }

    entry.past.push(currentSnapshot);
    trimStack(entry.past);
    entry.future = [];
    setGraphWithFlags(next, entry);
  };

  return {
    ...makeGraph(),
    canUndo: false,
    canRedo: false,

    addNodeAt: (x, y, title) => {
      let nodeId = "";
      applyUndoable((graph) => {
        const [next, createdId] = createNode(graph, { x, y, title });
        nodeId = createdId;
        return next;
      });
      return nodeId;
    },

    addNodeFromPresetAt: (x, y, presetId, titleOverride) => {
      const indexedPreset = nodePresetIndex[presetId];
      if (!indexedPreset) {
        return "";
      }
      let nodeId = "";
      applyUndoable((graph) => {
        const [next, createdId] = createNodeFromPreset(graph, {
          preset: indexedPreset.preset,
          x,
          y,
          titleOverride
        });
        nodeId = createdId;
        return next;
      });
      return nodeId;
    },

    addPin: (nodeId, direction, label) => {
      let createdPinId: string | null = null;
      applyUndoable((graph) => {
        const [next, pinId] = addPinToNode(graph, nodeId, direction, label);
        createdPinId = pinId;
        return next;
      });
      return createdPinId;
    },

    removePin: (pinId) => applyUndoable((graph) => removePin(graph, pinId)),
    reorderPin: (nodeId, direction, fromIndex, toIndex) =>
      applyUndoable((graph) => reorderPinInNode(graph, nodeId, direction, fromIndex, toIndex)),
    renameNode: (nodeId, title) => applyUndoable((graph) => renameNode(graph, nodeId, title)),
    renamePin: (pinId, label) => applyUndoable((graph) => renamePin(graph, pinId, label)),

    connectPins: (fromPinId, toPinId) => {
      let result: ConnectResult = { graph: toGraph(get()), success: false };
      applyUndoable((graph) => {
        result = connectPins(graph, fromPinId, toPinId);
        return result.success ? result.graph : graph;
      });
      return result;
    },

    setSelection: (ids) => applyNonUndoable((graph) => setSelectedNodes(graph, ids)),
    setSelectionByMarquee: (rect, mode) =>
      applyNonUndoable((graph) => setSelectionByMarquee(graph, rect, mode)),
    setEdgeSelection: (ids) => applyNonUndoable((graph) => setSelectedEdges(graph, ids)),
    clearSelection: () => applyNonUndoable((graph) => clearSelection(graph)),
    deleteSelection: () => applyUndoable((graph) => deleteSelection(graph)),
    duplicateSelection: () => applyUndoable((graph) => duplicateSelectedNodes(graph)),
    moveSelectionBy: (dx, dy) => applyUndoable((graph) => moveSelectedNodesBy(graph, dx, dy)),
    alignSelection: (kind) => applyUndoable((graph) => alignSelection(graph, kind)),
    distributeSelection: (axis) => applyUndoable((graph) => distributeSelection(graph, axis)),
    panBy: (dx, dy) => applyNonUndoable((graph) => panViewportBy(graph, dx, dy)),
    setViewport: (next) => applyNonUndoable((graph) => setViewport(graph, next)),
    zoomAt: (screenX, screenY, delta) =>
      applyNonUndoable((graph) => zoomAtScreenPoint(graph, screenX, screenY, delta)),
    setSingleInputPolicy: (value) => applyNonUndoable((graph) => setSingleInputPolicy(graph, value)),
    setAllowSameNodeConnections: (value) =>
      applyNonUndoable((graph) => setAllowSameNodeConnections(graph, value)),

    replaceGraph: (graph) => {
      const entry = ensureHistory(activeGraphContextId);
      entry.transactionDepth = 0;
      entry.transactionBefore = null;
      const next = replaceGraphState(toGraph(get()), graph);
      setGraphWithFlags(next, entry);
    },

    undo: () => {
      const entry = ensureHistory(activeGraphContextId);
      if (entry.transactionDepth > 0 || entry.past.length === 0) {
        return;
      }
      const current = toGraph(get());
      const previous = entry.past.pop();
      if (!previous) {
        return;
      }
      entry.future.push(snapshotContent(current));
      trimStack(entry.future);
      const restored = restoreContent(current, previous);
      setGraphWithFlags(restored, entry);
    },

    redo: () => {
      const entry = ensureHistory(activeGraphContextId);
      if (entry.transactionDepth > 0 || entry.future.length === 0) {
        return;
      }
      const current = toGraph(get());
      const nextSnapshot = entry.future.pop();
      if (!nextSnapshot) {
        return;
      }
      entry.past.push(snapshotContent(current));
      trimStack(entry.past);
      const restored = restoreContent(current, nextSnapshot);
      setGraphWithFlags(restored, entry);
    },

    beginHistoryTransaction: () => {
      const entry = ensureHistory(activeGraphContextId);
      if (entry.transactionDepth === 0) {
        entry.transactionBefore = snapshotContent(toGraph(get()));
      }
      entry.transactionDepth += 1;
    },

    endHistoryTransaction: () => {
      const entry = ensureHistory(activeGraphContextId);
      if (entry.transactionDepth === 0) {
        return;
      }
      entry.transactionDepth -= 1;
      if (entry.transactionDepth > 0) {
        return;
      }
      const before = entry.transactionBefore;
      entry.transactionBefore = null;
      if (!before) {
        return;
      }
      const current = toGraph(get());
      const after = snapshotContent(current);
      if (!hasContentChanged(before, after)) {
        set(withHistoryFlags(entry));
        return;
      }
      entry.past.push(before);
      trimStack(entry.past);
      entry.future = [];
      set(withHistoryFlags(entry));
    },

    activateGraphContext: (graphId, graph, resetHistory = false) => {
      activeGraphContextId = graphId;
      if (resetHistory) {
        historyByGraph.set(graphId, makeEmptyHistory());
      }
      const entry = ensureHistory(graphId);
      entry.transactionDepth = 0;
      entry.transactionBefore = null;
      const next = replaceGraphState(toGraph(get()), graph);
      setGraphWithFlags(next, entry);
    },

    clearGraphHistory: (graphId) => {
      historyByGraph.delete(graphId);
      if (graphId === activeGraphContextId) {
        const entry = ensureHistory(graphId);
        set(withHistoryFlags(entry));
      }
    }
  };
});
