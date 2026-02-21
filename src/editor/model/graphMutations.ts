import { produce } from "immer";
import type {
  EdgeModel,
  GraphModel,
  NodeModel,
  PinDirection,
  PinModel,
  Viewport
} from "./types";
import {
  NODE_BODY_BOTTOM_PADDING,
  PIN_ANCHOR_INSET,
  NODE_TITLE_HEIGHT,
  PIN_ROW_HEIGHT,
  PIN_TOP_PADDING
} from "./types";
import { layoutTokens } from "../theme/layoutTokens";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.5;

let nodeSequence = 1;
let pinSequence = 1;
let edgeSequence = 1;

export type ConnectResult = {
  graph: GraphModel;
  success: boolean;
  reason?: "missing-pin" | "direction" | "same-pin" | "same-node" | "occupied" | "duplicate";
  edgeId?: string;
};

export function makeGraph(): GraphModel {
  return {
    nodes: {},
    pins: {},
    edges: {},
    order: [],
    edgeOrder: [],
    selectedNodeIds: [],
    selectedEdgeIds: [],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    singleInputPolicy: true,
    allowSameNodeConnections: false
  };
}

export function createNode(
  graph: GraphModel,
  input: Partial<NodeModel> & { x: number; y: number; title?: string }
): [GraphModel, string] {
  const nodeId = input.id ?? `node_${nodeSequence++}`;
  const defaultInputPin = makePin(nodeId, "input", "In");
  const defaultOutputPin = makePin(nodeId, "output", "Out");
  const node: NodeModel = {
    id: nodeId,
    title: input.title ?? "Node",
    x: input.x,
    y: input.y,
    width: input.width ?? layoutTokens.node.width,
    height: input.height ?? 120,
    inputPinIds: [defaultInputPin.id],
    outputPinIds: [defaultOutputPin.id]
  };
  node.height = computeNodeHeight(node);

  return [
    produce(graph, (draft) => {
      draft.nodes[nodeId] = node;
      draft.pins[defaultInputPin.id] = defaultInputPin;
      draft.pins[defaultOutputPin.id] = defaultOutputPin;
      draft.order.push(nodeId);
      draft.selectedNodeIds = [nodeId];
      draft.selectedEdgeIds = [];
    }),
    nodeId
  ];
}

export function deleteSelection(graph: GraphModel): GraphModel {
  if (graph.selectedNodeIds.length === 0 && graph.selectedEdgeIds.length === 0) {
    return graph;
  }

  return produce(graph, (draft) => {
    for (const edgeId of draft.selectedEdgeIds) {
      delete draft.edges[edgeId];
    }

    for (const nodeId of draft.selectedNodeIds) {
      const node = draft.nodes[nodeId];
      if (!node) {
        continue;
      }
      for (const pinId of [...node.inputPinIds, ...node.outputPinIds]) {
        delete draft.pins[pinId];
      }
      delete draft.nodes[nodeId];
    }

    draft.edges = Object.fromEntries(
      Object.entries(draft.edges).filter(([, edge]) => draft.pins[edge.fromPinId] && draft.pins[edge.toPinId])
    );
    draft.edgeOrder = draft.edgeOrder.filter((id) => Boolean(draft.edges[id]));
    draft.order = draft.order.filter((id) => Boolean(draft.nodes[id]));
    draft.selectedNodeIds = [];
    draft.selectedEdgeIds = [];
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
      const pinMap = new Map<string, string>();
      const duplicateInputPins = original.inputPinIds.map((originalPinId) => {
        const originalPin = draft.pins[originalPinId];
        if (!originalPin) {
          return "";
        }
        const duplicatePinId = `pin_${pinSequence++}`;
        pinMap.set(originalPinId, duplicatePinId);
        draft.pins[duplicatePinId] = {
          ...originalPin,
          id: duplicatePinId,
          nodeId: duplicateId
        };
        return duplicatePinId;
      });
      const duplicateOutputPins = original.outputPinIds.map((originalPinId) => {
        const originalPin = draft.pins[originalPinId];
        if (!originalPin) {
          return "";
        }
        const duplicatePinId = `pin_${pinSequence++}`;
        pinMap.set(originalPinId, duplicatePinId);
        draft.pins[duplicatePinId] = {
          ...originalPin,
          id: duplicatePinId,
          nodeId: duplicateId
        };
        return duplicatePinId;
      });

      draft.nodes[duplicateId] = {
        ...original,
        id: duplicateId,
        x: original.x + 40,
        y: original.y + 40,
        inputPinIds: duplicateInputPins.filter(Boolean),
        outputPinIds: duplicateOutputPins.filter(Boolean)
      };
      draft.order.push(duplicateId);
      nextSelection.push(duplicateId);
    }

    draft.selectedNodeIds = nextSelection;
    draft.selectedEdgeIds = [];
  });
}

export function moveSelectedNodesBy(graph: GraphModel, dx: number, dy: number): GraphModel {
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
    if (draft.selectedNodeIds.length > 0) {
      draft.selectedEdgeIds = [];
    }
  });
}

export function setSelectedEdges(graph: GraphModel, ids: string[]): GraphModel {
  return produce(graph, (draft) => {
    draft.selectedEdgeIds = ids.filter((id) => Boolean(draft.edges[id]));
    if (draft.selectedEdgeIds.length > 0) {
      draft.selectedNodeIds = [];
    }
  });
}

export function clearSelection(graph: GraphModel): GraphModel {
  if (graph.selectedNodeIds.length === 0 && graph.selectedEdgeIds.length === 0) {
    return graph;
  }

  return produce(graph, (draft) => {
    draft.selectedNodeIds = [];
    draft.selectedEdgeIds = [];
  });
}

export function addPinToNode(
  graph: GraphModel,
  nodeId: string,
  direction: PinDirection,
  label?: string
): [GraphModel, string | null] {
  const node = graph.nodes[nodeId];
  if (!node) {
    return [graph, null];
  }

  const pin = makePin(nodeId, direction, label ?? (direction === "input" ? "Input" : "Output"));

  return [
    produce(graph, (draft) => {
      draft.pins[pin.id] = pin;
      if (direction === "input") {
        draft.nodes[nodeId].inputPinIds.push(pin.id);
      } else {
        draft.nodes[nodeId].outputPinIds.push(pin.id);
      }
      draft.nodes[nodeId].height = computeNodeHeight(draft.nodes[nodeId]);
    }),
    pin.id
  ];
}

export function removePin(graph: GraphModel, pinId: string): GraphModel {
  const pin = graph.pins[pinId];
  if (!pin) {
    return graph;
  }

  return produce(graph, (draft) => {
    const node = draft.nodes[pin.nodeId];
    if (node) {
      node.inputPinIds = node.inputPinIds.filter((id) => id !== pinId);
      node.outputPinIds = node.outputPinIds.filter((id) => id !== pinId);
      node.height = computeNodeHeight(node);
    }

    delete draft.pins[pinId];
    draft.edges = Object.fromEntries(
      Object.entries(draft.edges).filter(([, edge]) => edge.fromPinId !== pinId && edge.toPinId !== pinId)
    );
    draft.edgeOrder = draft.edgeOrder.filter((id) => Boolean(draft.edges[id]));
    draft.selectedEdgeIds = draft.selectedEdgeIds.filter((id) => Boolean(draft.edges[id]));
  });
}

export function connectPins(graph: GraphModel, fromPinId: string, toPinId: string): ConnectResult {
  const fromPin = graph.pins[fromPinId];
  const toPin = graph.pins[toPinId];
  if (!fromPin || !toPin) {
    return { graph, success: false, reason: "missing-pin" };
  }

  if (fromPinId === toPinId) {
    return { graph, success: false, reason: "same-pin" };
  }

  if (!graph.allowSameNodeConnections && fromPin.nodeId === toPin.nodeId) {
    return { graph, success: false, reason: "same-node" };
  }

  if (fromPin.direction !== "output" || toPin.direction !== "input") {
    return { graph, success: false, reason: "direction" };
  }

  const duplicate = Object.values(graph.edges).find(
    (edge) => edge.fromPinId === fromPinId && edge.toPinId === toPinId
  );
  if (duplicate) {
    return { graph, success: false, reason: "duplicate" };
  }

  if (graph.singleInputPolicy) {
    const existingInputEdge = Object.values(graph.edges).find((edge) => edge.toPinId === toPinId);
    if (existingInputEdge) {
      return { graph, success: false, reason: "occupied" };
    }
  }

  const edge: EdgeModel = {
    id: `edge_${edgeSequence++}`,
    fromPinId,
    toPinId,
    color: fromPin.color
  };

  const next = produce(graph, (draft) => {
    draft.edges[edge.id] = edge;
    draft.edgeOrder.push(edge.id);
    draft.selectedEdgeIds = [edge.id];
    draft.selectedNodeIds = [];
  });

  return { graph: next, success: true, edgeId: edge.id };
}

export function setSingleInputPolicy(graph: GraphModel, value: boolean): GraphModel {
  return produce(graph, (draft) => {
    draft.singleInputPolicy = value;
  });
}

export function setAllowSameNodeConnections(graph: GraphModel, value: boolean): GraphModel {
  return produce(graph, (draft) => {
    draft.allowSameNodeConnections = value;
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

export function getPinCenter(graph: GraphModel, pinId: string): { x: number; y: number } | null {
  const pin = graph.pins[pinId];
  if (!pin) {
    return null;
  }

  const node = graph.nodes[pin.nodeId];
  if (!node) {
    return null;
  }

  const pinIds = pin.direction === "input" ? node.inputPinIds : node.outputPinIds;
  const index = pinIds.indexOf(pinId);
  if (index < 0) {
    return null;
  }

  const x =
    pin.direction === "input"
      ? node.x + PIN_ANCHOR_INSET
      : node.x + node.width - PIN_ANCHOR_INSET;
  const y = node.y + NODE_TITLE_HEIGHT + PIN_TOP_PADDING + PIN_ROW_HEIGHT * index + PIN_ROW_HEIGHT / 2;
  return { x, y };
}

export function replaceGraphState(current: GraphModel, next: GraphModel): GraphModel {
  const sanitized = sanitizeGraph(next);
  rebaseIdSequences(sanitized);
  return sanitized;
}

function computeNodeHeight(node: NodeModel): number {
  const rowCount = Math.max(1, node.inputPinIds.length, node.outputPinIds.length);
  return NODE_TITLE_HEIGHT + PIN_TOP_PADDING + rowCount * PIN_ROW_HEIGHT + NODE_BODY_BOTTOM_PADDING;
}

function makePin(nodeId: string, direction: PinDirection, label: string): PinModel {
  return {
    id: `pin_${pinSequence++}`,
    nodeId,
    direction,
    label,
    type: direction === "input" ? "Any In" : "Any Out",
    color: direction === "input" ? "#58c4ff" : "#ffb655",
    shape: "circle"
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeGraph(source: GraphModel): GraphModel {
  const base = makeGraph();

  const nodes = Object.fromEntries(
    Object.entries(source.nodes).map(([id, node]) => {
      const inputPinIds = node.inputPinIds.filter((pinId) => Boolean(source.pins[pinId]));
      const outputPinIds = node.outputPinIds.filter((pinId) => Boolean(source.pins[pinId]));
      const cleanNode: NodeModel = {
        ...node,
        inputPinIds,
        outputPinIds,
        height: computeNodeHeight({ ...node, inputPinIds, outputPinIds })
      };
      return [id, cleanNode];
    })
  );

  const pins = Object.fromEntries(
    Object.entries(source.pins).filter(([, pin]) => Boolean(nodes[pin.nodeId]))
  );

  const edges = Object.fromEntries(
    Object.entries(source.edges).filter(
      ([, edge]) => Boolean(pins[edge.fromPinId]) && Boolean(pins[edge.toPinId])
    )
  );

  const order = source.order.filter((id) => Boolean(nodes[id]));
  const edgeOrder = source.edgeOrder.filter((id) => Boolean(edges[id]));

  return {
    ...base,
    nodes,
    pins,
    edges,
    order,
    edgeOrder,
    viewport: {
      x: source.viewport?.x ?? 0,
      y: source.viewport?.y ?? 0,
      zoom: clamp(source.viewport?.zoom ?? 1, MIN_ZOOM, MAX_ZOOM)
    },
    singleInputPolicy: source.singleInputPolicy ?? true,
    allowSameNodeConnections: source.allowSameNodeConnections ?? false
  };
}

function rebaseIdSequences(graph: GraphModel): void {
  nodeSequence = Math.max(1, maxNumericSuffix(graph.nodes, "node_") + 1);
  pinSequence = Math.max(1, maxNumericSuffix(graph.pins, "pin_") + 1);
  edgeSequence = Math.max(1, maxNumericSuffix(graph.edges, "edge_") + 1);
}

function maxNumericSuffix(collection: Record<string, unknown>, prefix: string): number {
  let max = 0;
  for (const id of Object.keys(collection)) {
    if (!id.startsWith(prefix)) {
      continue;
    }
    const suffix = Number.parseInt(id.slice(prefix.length), 10);
    if (Number.isFinite(suffix)) {
      max = Math.max(max, suffix);
    }
  }
  return max;
}
