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

type GraphActions = {
  addNodeAt: (x: number, y: number, title?: string) => string;
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
};

export const useGraphStore = create<GraphModel & GraphActions>((set, get) => ({
  ...makeGraph(),

  addNodeAt: (x, y, title) => {
    const [next, nodeId] = createNode(get(), { x, y, title });
    set(next);
    return nodeId;
  },

  addPin: (nodeId, direction, label) => {
    const [next, pinId] = addPinToNode(get(), nodeId, direction, label);
    set(next);
    return pinId;
  },

  removePin: (pinId) => set(removePin(get(), pinId)),
  reorderPin: (nodeId, direction, fromIndex, toIndex) =>
    set(reorderPinInNode(get(), nodeId, direction, fromIndex, toIndex)),
  renameNode: (nodeId, title) => set(renameNode(get(), nodeId, title)),
  renamePin: (pinId, label) => set(renamePin(get(), pinId, label)),

  connectPins: (fromPinId, toPinId) => {
    const result = connectPins(get(), fromPinId, toPinId);
    if (result.success) {
      set(result.graph);
    }
    return result;
  },

  setSelection: (ids) => set(setSelectedNodes(get(), ids)),
  setSelectionByMarquee: (rect, mode) => set(setSelectionByMarquee(get(), rect, mode)),
  setEdgeSelection: (ids) => set(setSelectedEdges(get(), ids)),
  clearSelection: () => set(clearSelection(get())),
  deleteSelection: () => set(deleteSelection(get())),
  duplicateSelection: () => set(duplicateSelectedNodes(get())),
  moveSelectionBy: (dx, dy) => set(moveSelectedNodesBy(get(), dx, dy)),
  alignSelection: (kind) => set(alignSelection(get(), kind)),
  distributeSelection: (axis) => set(distributeSelection(get(), axis)),
  panBy: (dx, dy) => set(panViewportBy(get(), dx, dy)),
  setViewport: (next) => set(setViewport(get(), next)),
  zoomAt: (screenX, screenY, delta) => set(zoomAtScreenPoint(get(), screenX, screenY, delta)),
  setSingleInputPolicy: (value) => set(setSingleInputPolicy(get(), value)),
  setAllowSameNodeConnections: (value) => set(setAllowSameNodeConnections(get(), value)),
  replaceGraph: (graph) => set(replaceGraphState(get(), graph))
}));
