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

export type NavigationMode = "auto" | "mouse" | "trackpad";
export type ResolvedNavigationMode = "mouse" | "trackpad" | null;

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

export const NODE_TITLE_HEIGHT = layoutTokens.node.titleHeight;
export const PIN_ROW_HEIGHT = layoutTokens.pin.rowHeight;
export const PIN_TOP_PADDING = layoutTokens.pin.topPadding;
export const NODE_BODY_BOTTOM_PADDING = layoutTokens.node.bodyBottomPadding;
export const PIN_ANCHOR_INSET = layoutTokens.pin.anchorInset;
import { layoutTokens } from "../theme/layoutTokens";
