import { create } from "zustand";
import type { ConnectResult } from "../model/graphMutations";
import type { GraphModel, PinDirection } from "../model/types";
import {
  addPinToNode,
  clearSelection,
  connectPins,
  createNode,
  deleteSelection,
  duplicateSelectedNodes,
  makeGraph,
  moveSelectedNodesBy,
  panViewportBy,
  replaceGraphState,
  removePin,
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
  connectPins: (fromPinId: string, toPinId: string) => ConnectResult;
  setSelection: (ids: string[]) => void;
  setEdgeSelection: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  moveSelectionBy: (dx: number, dy: number) => void;
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

  connectPins: (fromPinId, toPinId) => {
    const result = connectPins(get(), fromPinId, toPinId);
    if (result.success) {
      set(result.graph);
    }
    return result;
  },

  setSelection: (ids) => set(setSelectedNodes(get(), ids)),
  setEdgeSelection: (ids) => set(setSelectedEdges(get(), ids)),
  clearSelection: () => set(clearSelection(get())),
  deleteSelection: () => set(deleteSelection(get())),
  duplicateSelection: () => set(duplicateSelectedNodes(get())),
  moveSelectionBy: (dx, dy) => set(moveSelectedNodesBy(get(), dx, dy)),
  panBy: (dx, dy) => set(panViewportBy(get(), dx, dy)),
  setViewport: (next) => set(setViewport(get(), next)),
  zoomAt: (screenX, screenY, delta) => set(zoomAtScreenPoint(get(), screenX, screenY, delta)),
  setSingleInputPolicy: (value) => set(setSingleInputPolicy(get(), value)),
  setAllowSameNodeConnections: (value) => set(setAllowSameNodeConnections(get(), value)),
  replaceGraph: (graph) => set(replaceGraphState(get(), graph))
}));
