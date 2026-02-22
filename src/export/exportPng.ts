import { getPinCenter } from "../editor/model/graphMutations";
import type { GraphModel, NodeModel } from "../editor/model/types";
import { NODE_TITLE_HEIGHT, PIN_ANCHOR_INSET, PIN_ROW_HEIGHT, PIN_TOP_PADDING } from "../editor/model/types";
import { layoutTokens } from "../editor/theme/layoutTokens";

type ExportMode = "viewport" | "full";
type ExportOptions = {
  framed?: boolean;
  frameTitle?: string;
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
  const padding = 60;
  const outputWidth = Math.max(320, Math.ceil(worldRect.width + padding * 2));
  const outputHeight = Math.max(220, Math.ceil(worldRect.height + padding * 2));
  const scale = window.devicePixelRatio > 1 ? 2 : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(outputWidth * scale);
  canvas.height = Math.floor(outputHeight * scale);
  canvas.style.width = `${outputWidth}px`;
  canvas.style.height = `${outputHeight}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.scale(scale, scale);

  const offsetX = padding - worldRect.x;
  const offsetY = padding - worldRect.y;

  if (options?.framed) {
    const frame = getFrameRect(outputWidth, outputHeight);
    clipRoundedRect(ctx, frame.x, frame.y, frame.width, frame.height, frame.radius);
    drawBackground(ctx, outputWidth, outputHeight);
    drawGrid(ctx, outputWidth, outputHeight, 40, "rgba(130, 150, 200, 0.15)");
    drawEdges(ctx, graph, offsetX, offsetY);
    drawNodes(ctx, graph, offsetX, offsetY);
    ctx.restore();
    drawFramePreset(ctx, outputWidth, outputHeight, options.frameTitle ?? "ngsketch mockup");
  } else {
    drawBackground(ctx, outputWidth, outputHeight);
    drawGrid(ctx, outputWidth, outputHeight, 40, "rgba(130, 150, 200, 0.15)");
    drawEdges(ctx, graph, offsetX, offsetY);
    drawNodes(ctx, graph, offsetX, offsetY);
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    const fileSuffix = options?.framed ? "framed" : mode === "viewport" ? "viewport" : "full";
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ngsketch-${fileSuffix}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, "image/png");
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

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = "#0f1218";
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

function drawEdges(ctx: CanvasRenderingContext2D, graph: GraphModel, offsetX: number, offsetY: number): void {
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
    ctx.strokeStyle = edge.color;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
}

function drawNodes(ctx: CanvasRenderingContext2D, graph: GraphModel, offsetX: number, offsetY: number): void {
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
      layoutTokens.colors.nodeFill,
      layoutTokens.colors.nodeStroke
    );

    ctx.fillStyle = layoutTokens.colors.title;
    ctx.font = `${layoutTokens.text.titleWeight} ${layoutTokens.text.titleSize}px ${layoutTokens.text.family}`;
    ctx.textBaseline = "middle";
    ctx.fillText(node.title, x + 12, y + NODE_TITLE_HEIGHT / 2 + 1);

    ctx.strokeStyle = layoutTokens.colors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + NODE_TITLE_HEIGHT);
    ctx.lineTo(x + node.width, y + NODE_TITLE_HEIGHT);
    ctx.stroke();

    drawNodePins(ctx, graph, node, x, y);
  }
}

function drawNodePins(
  ctx: CanvasRenderingContext2D,
  graph: GraphModel,
  node: NodeModel,
  x: number,
  y: number
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

    ctx.fillStyle = layoutTokens.colors.pinLabel;
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
    ctx.fillStyle = layoutTokens.colors.pinLabel;
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
  title: string
): void {
  const { x: frameX, y: frameY, width: frameW, height: frameH, radius } = getFrameRect(width, height);

  ctx.beginPath();
  ctx.moveTo(frameX + radius, frameY);
  ctx.arcTo(frameX + frameW, frameY, frameX + frameW, frameY + frameH, radius);
  ctx.arcTo(frameX + frameW, frameY + frameH, frameX, frameY + frameH, radius);
  ctx.arcTo(frameX, frameY + frameH, frameX, frameY, radius);
  ctx.arcTo(frameX, frameY, frameX + frameW, frameY, radius);
  ctx.closePath();
  ctx.strokeStyle = "rgba(125, 165, 220, 0.52)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(224, 237, 255, 0.93)";
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
