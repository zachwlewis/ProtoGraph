import { layoutTokens } from "../theme/layoutTokens";

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
export type ThemePresetId = "midnight" | "blueprint" | "slate" | "blender";

export type ExportPrefs = {
  scale: number;
  margin: number;
  includeFrame: boolean;
  frameTitle: string;
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

export type AppSettings = {
  navigationMode: NavigationMode;
  resolvedNavigationMode: ResolvedNavigationMode;
};

export type SavedGraph = {
  id: string;
  name: string;
  updatedAt: number;
  graph: GraphModel;
  exportPrefs: ExportPrefs;
  themePresetId: ThemePresetId;
};

export type GraphLibrary = {
  version: 2;
  activeGraphId: string;
  graphs: Record<string, SavedGraph>;
  order: string[];
  settings: AppSettings;
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

export const DEFAULT_EXPORT_PREFS: ExportPrefs = {
  scale: 2,
  margin: 60,
  includeFrame: false,
  frameTitle: "ProtoGraph mockup"
};
