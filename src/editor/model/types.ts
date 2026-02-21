export type NodeModel = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type GraphModel = {
  nodes: Record<string, NodeModel>;
  order: string[];
  selectedNodeIds: string[];
  viewport: Viewport;
};

export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1
};
