import { create } from "zustand";
import type { GraphModel } from "../model/types";
import {
  clearSelection,
  createNode,
  deleteSelectedNodes,
  duplicateSelectedNodes,
  makeGraph,
  moveSelectedNodesBy,
  panViewportBy,
  setSelectedNodes,
  setViewport,
  zoomAtScreenPoint
} from "../model/graphMutations";

type GraphActions = {
  addNodeAt: (x: number, y: number, title?: string) => string;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  moveSelectionBy: (dx: number, dy: number) => void;
  panBy: (dx: number, dy: number) => void;
  setViewport: (next: GraphModel["viewport"]) => void;
  zoomAt: (screenX: number, screenY: number, delta: number) => void;
};

export const useGraphStore = create<GraphModel & GraphActions>((set, get) => ({
  ...makeGraph(),

  addNodeAt: (x, y, title) => {
    const [next, nodeId] = createNode(get(), { x, y, title });
    set(next);
    return nodeId;
  },

  setSelection: (ids) => set(setSelectedNodes(get(), ids)),
  clearSelection: () => set(clearSelection(get())),
  deleteSelection: () => set(deleteSelectedNodes(get())),
  duplicateSelection: () => set(duplicateSelectedNodes(get())),
  moveSelectionBy: (dx, dy) => set(moveSelectedNodesBy(get(), dx, dy)),
  panBy: (dx, dy) => set(panViewportBy(get(), dx, dy)),
  setViewport: (next) => set(setViewport(get(), next)),
  zoomAt: (screenX, screenY, delta) => set(zoomAtScreenPoint(get(), screenX, screenY, delta))
}));
