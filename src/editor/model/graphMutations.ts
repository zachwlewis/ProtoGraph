import { produce } from "immer";
import type { GraphModel, NodeModel, Viewport } from "./types";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.5;

let nodeSequence = 1;

export function makeGraph(): GraphModel {
  return {
    nodes: {},
    order: [],
    selectedNodeIds: [],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    }
  };
}

export function createNode(
  graph: GraphModel,
  input: Partial<NodeModel> & { x: number; y: number; title?: string }
): [GraphModel, string] {
  const nodeId = input.id ?? `node_${nodeSequence++}`;
  const node: NodeModel = {
    id: nodeId,
    title: input.title ?? "Node",
    x: input.x,
    y: input.y,
    width: input.width ?? 240,
    height: input.height ?? 120
  };

  return [
    produce(graph, (draft) => {
      draft.nodes[nodeId] = node;
      draft.order.push(nodeId);
      draft.selectedNodeIds = [nodeId];
    }),
    nodeId
  ];
}

export function deleteSelectedNodes(graph: GraphModel): GraphModel {
  if (graph.selectedNodeIds.length === 0) {
    return graph;
  }

  return produce(graph, (draft) => {
    for (const nodeId of draft.selectedNodeIds) {
      delete draft.nodes[nodeId];
    }
    draft.order = draft.order.filter((id) => draft.nodes[id]);
    draft.selectedNodeIds = [];
  });
}

export function duplicateSelectedNodes(graph: GraphModel): GraphModel {
  if (graph.selectedNodeIds.length === 0) {
    return graph;
  }

  return produce(graph, (draft) => {
    const nextSelection: string[] = [];

    for (const originalNodeId of draft.selectedNodeIds) {
      const original = draft.nodes[originalNodeId];
      if (!original) {
        continue;
      }

      const duplicateId = `node_${nodeSequence++}`;
      draft.nodes[duplicateId] = {
        ...original,
        id: duplicateId,
        x: original.x + 40,
        y: original.y + 40
      };
      draft.order.push(duplicateId);
      nextSelection.push(duplicateId);
    }

    draft.selectedNodeIds = nextSelection;
  });
}

export function moveSelectedNodesBy(
  graph: GraphModel,
  dx: number,
  dy: number
): GraphModel {
  if (dx === 0 && dy === 0) {
    return graph;
  }

  return produce(graph, (draft) => {
    for (const nodeId of draft.selectedNodeIds) {
      const node = draft.nodes[nodeId];
      if (!node) {
        continue;
      }
      node.x += dx;
      node.y += dy;
    }
  });
}

export function setSelectedNodes(graph: GraphModel, ids: string[]): GraphModel {
  return produce(graph, (draft) => {
    draft.selectedNodeIds = ids.filter((id) => Boolean(draft.nodes[id]));
  });
}

export function clearSelection(graph: GraphModel): GraphModel {
  if (graph.selectedNodeIds.length === 0) {
    return graph;
  }

  return produce(graph, (draft) => {
    draft.selectedNodeIds = [];
  });
}

export function setViewport(graph: GraphModel, viewport: Viewport): GraphModel {
  return produce(graph, (draft) => {
    draft.viewport = {
      ...viewport,
      zoom: clamp(viewport.zoom, MIN_ZOOM, MAX_ZOOM)
    };
  });
}

export function panViewportBy(graph: GraphModel, dx: number, dy: number): GraphModel {
  return setViewport(graph, {
    ...graph.viewport,
    x: graph.viewport.x + dx,
    y: graph.viewport.y + dy
  });
}

export function zoomAtScreenPoint(
  graph: GraphModel,
  cursorX: number,
  cursorY: number,
  zoomDelta: number
): GraphModel {
  const nextZoom = clamp(graph.viewport.zoom * zoomDelta, MIN_ZOOM, MAX_ZOOM);
  const worldX = (cursorX - graph.viewport.x) / graph.viewport.zoom;
  const worldY = (cursorY - graph.viewport.y) / graph.viewport.zoom;

  const nextViewport: Viewport = {
    x: cursorX - worldX * nextZoom,
    y: cursorY - worldY * nextZoom,
    zoom: nextZoom
  };

  return setViewport(graph, nextViewport);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
