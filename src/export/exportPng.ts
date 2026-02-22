import { getPinCenter } from "../editor/model/graphMutations";
import type { GraphModel, NodeModel, ThemePresetId } from "../editor/model/types";
import { NODE_TITLE_HEIGHT, PIN_ANCHOR_INSET, PIN_ROW_HEIGHT, PIN_TOP_PADDING } from "../editor/model/types";
import { layoutTokens } from "../editor/theme/layoutTokens";
import { getThemePreset } from "../editor/theme/themePresets";

type ExportMode = "viewport" | "full";
type ExportOptions = {
  framed?: boolean;
  frameTitle?: string;
  scale?: number;
  margin?: number;
  filenameBase?: string;
  themePresetId?: ThemePresetId;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function exportGraphToPng(
  graph: GraphModel,
  mode: ExportMode,
  viewportSize: { width: number; height: number },
  options?: ExportOptions
): void {
  const worldRect = mode === "viewport" ? viewportWorldRect(graph, viewportSize) : fullGraphWorldRect(graph);
  const margin = options?.margin ?? 60;
  const scale = options?.scale ?? (window.devicePixelRatio > 1 ? 2 : 1);
  const theme = getThemePreset(options?.themePresetId ?? "midnight");
  const metrics = computeOutputMetrics(worldRect, margin);

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(metrics.outputWidth * scale);
  canvas.height = Math.floor(metrics.outputHeight * scale);
  canvas.style.width = `${metrics.outputWidth}px`;
  canvas.style.height = `${metrics.outputHeight}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.scale(scale, scale);

  const offsetX = metrics.offsetX;
  const offsetY = metrics.offsetY;

  if (options?.framed) {
    const frame = getFrameRect(metrics.outputWidth, metrics.outputHeight);
    clipRoundedRect(ctx, frame.x, frame.y, frame.width, frame.height, frame.radius);
    drawBackground(ctx, metrics.outputWidth, metrics.outputHeight, theme.export.canvasBg);
    drawGrid(ctx, metrics.outputWidth, metrics.outputHeight, 40, theme.export.grid);
    drawEdges(ctx, graph, offsetX, offsetY, theme.export.wire);
    drawNodes(ctx, graph, offsetX, offsetY, theme);
    ctx.restore();
    drawFramePreset(
      ctx,
      metrics.outputWidth,
      metrics.outputHeight,
      options.frameTitle ?? "ProtoGraph mockup",
      theme.export.frameStroke,
      theme.export.frameTitle
    );
  } else {
    drawBackground(ctx, metrics.outputWidth, metrics.outputHeight, theme.export.canvasBg);
    drawGrid(ctx, metrics.outputWidth, metrics.outputHeight, 40, theme.export.grid);
    drawEdges(ctx, graph, offsetX, offsetY, theme.export.wire);
    drawNodes(ctx, graph, offsetX, offsetY, theme);
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const fileBase = options?.filenameBase ?? "ProtoGraph";
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resolvePngFilename(fileBase, mode, Boolean(options?.framed));
    anchor.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function resolvePngFilename(base: string, mode: ExportMode, framed: boolean): string {
  const fileSuffix = framed ? "framed" : mode === "viewport" ? "viewport" : "full";
  return `${base}-${fileSuffix}.png`;
}

function computeOutputMetrics(worldRect: Rect, margin: number): {
  outputWidth: number;
  outputHeight: number;
  offsetX: number;
  offsetY: number;
} {
  const outputWidth = Math.max(320, Math.ceil(worldRect.width + margin * 2));
  const outputHeight = Math.max(220, Math.ceil(worldRect.height + margin * 2));
  return {
    outputWidth,
    outputHeight,
    offsetX: margin - worldRect.x,
    offsetY: margin - worldRect.y
  };
}

function viewportWorldRect(graph: GraphModel, viewportSize: { width: number; height: number }): Rect {
  const width = viewportSize.width / graph.viewport.zoom;
  const height = viewportSize.height / graph.viewport.zoom;
  return {
    x: -graph.viewport.x / graph.viewport.zoom,
    y: -graph.viewport.y / graph.viewport.zoom,
    width,
    height
  };
}

function fullGraphWorldRect(graph: GraphModel): Rect {
  const nodes = graph.order.map((id) => graph.nodes[id]).filter(Boolean) as NodeModel[];
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 1000, height: 700 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
}

function drawEdges(
  ctx: CanvasRenderingContext2D,
  graph: GraphModel,
  offsetX: number,
  offsetY: number,
  wireColor: string
): void {
  for (const edgeId of graph.edgeOrder) {
    const edge = graph.edges[edgeId];
    if (!edge) {
      continue;
    }
    const from = getPinCenter(graph, edge.fromPinId);
    const to = getPinCenter(graph, edge.toPinId);
    if (!from || !to) {
      continue;
    }

    const x1 = from.x + offsetX;
    const y1 = from.y + offsetY;
    const x2 = to.x + offsetX;
    const y2 = to.y + offsetY;
    const dx = Math.abs(x2 - x1);
    const c = Math.max(48, dx * 0.45);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + c, y1, x2 - c, y2, x2, y2);
    ctx.strokeStyle = wireColor;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
}

function drawNodes(
  ctx: CanvasRenderingContext2D,
  graph: GraphModel,
  offsetX: number,
  offsetY: number,
  theme: ReturnType<typeof getThemePreset>
): void {
  for (const nodeId of graph.order) {
    const node = graph.nodes[nodeId];
    if (!node) {
      continue;
    }

    const x = node.x + offsetX;
    const y = node.y + offsetY;

    drawRoundedRect(
      ctx,
      x,
      y,
      node.width,
      node.height,
      layoutTokens.node.borderRadius,
      theme.export.nodeFill,
      theme.export.nodeStroke
    );

    ctx.fillStyle = theme.export.nodeTitle;
    ctx.font = `${layoutTokens.text.titleWeight} ${layoutTokens.text.titleSize}px ${layoutTokens.text.family}`;
    ctx.textBaseline = "middle";
    ctx.fillText(node.title, x + 12, y + NODE_TITLE_HEIGHT / 2 + 1);

    ctx.strokeStyle = theme.export.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + NODE_TITLE_HEIGHT);
    ctx.lineTo(x + node.width, y + NODE_TITLE_HEIGHT);
    ctx.stroke();

    drawNodePins(ctx, graph, node, x, y, theme.export.pinLabel);
  }
}

function drawNodePins(
  ctx: CanvasRenderingContext2D,
  graph: GraphModel,
  node: NodeModel,
  x: number,
  y: number,
  pinLabelColor: string
): void {
  ctx.font = `${layoutTokens.text.pinWeight} ${layoutTokens.text.pinSize}px ${layoutTokens.text.family}`;
  ctx.textBaseline = "middle";
  const pinRadius = layoutTokens.pin.radius;
  const labelGap = layoutTokens.pin.labelGap;

  for (let i = 0; i < node.inputPinIds.length; i++) {
    const pin = graph.pins[node.inputPinIds[i]];
    if (!pin) {
      continue;
    }
    const cy = y + NODE_TITLE_HEIGHT + PIN_TOP_PADDING + PIN_ROW_HEIGHT * i + PIN_ROW_HEIGHT / 2;
    const cx = x + PIN_ANCHOR_INSET;

    ctx.beginPath();
    ctx.arc(cx, cy, pinRadius, 0, Math.PI * 2);
    ctx.fillStyle = pin.color;
    ctx.fill();

    ctx.fillStyle = pinLabelColor;
    ctx.fillText(pin.label, cx + pinRadius + labelGap, cy);
  }

  for (let i = 0; i < node.outputPinIds.length; i++) {
    const pin = graph.pins[node.outputPinIds[i]];
    if (!pin) {
      continue;
    }
    const cy = y + NODE_TITLE_HEIGHT + PIN_TOP_PADDING + PIN_ROW_HEIGHT * i + PIN_ROW_HEIGHT / 2;
    const cx = x + node.width - PIN_ANCHOR_INSET;

    ctx.beginPath();
    ctx.arc(cx, cy, pinRadius, 0, Math.PI * 2);
    ctx.fillStyle = pin.color;
    ctx.fill();

    const labelWidth = ctx.measureText(pin.label).width;
    ctx.fillStyle = pinLabelColor;
    ctx.fillText(pin.label, cx - pinRadius - labelGap - labelWidth, cy);
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke: string
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();

  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawFramePreset(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  strokeColor: string,
  titleColor: string
): void {
  const { x: frameX, y: frameY, width: frameW, height: frameH, radius } = getFrameRect(width, height);

  ctx.beginPath();
  ctx.moveTo(frameX + radius, frameY);
  ctx.arcTo(frameX + frameW, frameY, frameX + frameW, frameY + frameH, radius);
  ctx.arcTo(frameX + frameW, frameY + frameH, frameX, frameY + frameH, radius);
  ctx.arcTo(frameX, frameY + frameH, frameX, frameY, radius);
  ctx.arcTo(frameX, frameY, frameX + frameW, frameY, radius);
  ctx.closePath();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = titleColor;
  ctx.font = `600 13px ${layoutTokens.text.family}`;
  ctx.textBaseline = "middle";
  ctx.fillText(title, frameX + 14, frameY + 16);
}

function getFrameRect(width: number, height: number): {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
} {
  const pad = 14;
  return {
    x: pad,
    y: pad,
    width: width - pad * 2,
    height: height - pad * 2,
    radius: 14
  };
}

function clipRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.clip();
}

export const __testables = {
  resolvePngFilename,
  computeOutputMetrics
};
