export type PinDirection = "input" | "output";

export type PinShape = "circle" | "diamond" | "square";

export type PinModel = {
  id: string;
  nodeId: string;
  direction: PinDirection;
  label: string;
  type: string;
  color: string;
  shape: PinShape;
};

export type EdgeModel = {
  id: string;
  fromPinId: string;
  toPinId: string;
  color: string;
};

export type NodeModel = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputPinIds: string[];
  outputPinIds: string[];
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type GraphModel = {
  nodes: Record<string, NodeModel>;
  pins: Record<string, PinModel>;
  edges: Record<string, EdgeModel>;
  order: string[];
  edgeOrder: string[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  viewport: Viewport;
  singleInputPolicy: boolean;
  allowSameNodeConnections: boolean;
};

export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1
};

export const NODE_TITLE_HEIGHT = 38;
export const PIN_ROW_HEIGHT = 22;
export const PIN_TOP_PADDING = 12;
export const NODE_BODY_BOTTOM_PADDING = 14;
