import { getPinCenter } from "../editor/model/graphMutations";
import type { GraphModel, NodeModel, PinColor, PinModel, ThemePresetId } from "../editor/model/types";
import { NODE_TITLE_HEIGHT, PIN_ANCHOR_INSET, PIN_ROW_HEIGHT, PIN_TOP_PADDING } from "../editor/model/types";
import { layoutTokens } from "../editor/theme/layoutTokens";
import { getThemePreset } from "../editor/theme/themePresets";
import { tracePinShapePath } from "../editor/utils/pinShapeGeometry";

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

type NodePinLayout = {
  titleInputPinId: string | null;
  titleOutputPinId: string | null;
  bodyInputPinIds: string[];
  bodyOutputPinIds: string[];
};

type NodeRenderStyle = {
  radius: number;
  borderWidth: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowColor: string;
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
    drawEdges(ctx, graph, offsetX, offsetY, theme.export.wire, theme, graph.blendWireColors);
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
    drawEdges(ctx, graph, offsetX, offsetY, theme.export.wire, theme, graph.blendWireColors);
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
  wireColor: string,
  theme: ReturnType<typeof getThemePreset>,
  blendWireColors: boolean
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
    const fromPin = graph.pins[edge.fromPinId];
    const toPin = graph.pins[edge.toPinId];

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + c, y1, x2 - c, y2, x2, y2);
    if (blendWireColors && fromPin && toPin && typeof ctx.createLinearGradient === "function") {
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, resolvePinColor(fromPin.color, theme));
      gradient.addColorStop(1, resolvePinColor(toPin.color, theme));
      ctx.strokeStyle = gradient;
    } else {
      ctx.strokeStyle = blendWireColors ? wireColor : theme.export.pinColors.white;
    }
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
  const connectedPinIds = getConnectedPinIds(graph);
  const nodeStyle = resolveThemeNodeRenderStyle(theme);
  for (const nodeId of graph.order) {
    const node = graph.nodes[nodeId];
    if (!node) {
      continue;
    }

    const x = node.x + offsetX;
    const y = node.y + offsetY;

    drawNodeShadow(ctx, x, y, node.width, node.height, nodeStyle);
    drawRoundedRect(
      ctx,
      x,
      y,
      node.width,
      node.height,
      nodeStyle.radius,
      theme.export.nodeFill,
      theme.export.nodeStroke,
      nodeStyle.borderWidth
    );
    drawNodeTintOverlay(ctx, node, x, y, theme, nodeStyle.radius);
    drawNodeTitle(ctx, node, x, y, theme);
    if (!node.isCondensed) {
      drawNodeDivider(ctx, x, y, node.width, theme.export.divider);
    }
    drawNodePins(ctx, graph, node, x, y, theme.export.pinLabel, connectedPinIds, theme);
  }
}

function drawNodePins(
  ctx: CanvasRenderingContext2D,
  graph: GraphModel,
  node: NodeModel,
  x: number,
  y: number,
  pinLabelColor: string,
  connectedPinIds: ReadonlySet<string>,
  theme: ReturnType<typeof getThemePreset>
): void {
  ctx.font = `${layoutTokens.text.pinWeight} ${layoutTokens.text.pinSize}px ${layoutTokens.text.family}`;
  ctx.textBaseline = "middle";
  const pinRadius = layoutTokens.pin.radius;
  const labelGap = layoutTokens.pin.labelGap;
  const pinLayout = resolveNodePinLayout(node);

  if (pinLayout.titleInputPinId) {
    const pin = graph.pins[pinLayout.titleInputPinId];
    if (pin) {
      drawPinGlyph(
        ctx,
        pin,
        x + PIN_ANCHOR_INSET,
        y + NODE_TITLE_HEIGHT / 2,
        pinRadius,
        connectedPinIds.has(pin.id),
        theme
      );
    }
  }

  if (pinLayout.titleOutputPinId) {
    const pin = graph.pins[pinLayout.titleOutputPinId];
    if (pin) {
      drawPinGlyph(
        ctx,
        pin,
        x + node.width - PIN_ANCHOR_INSET,
        y + NODE_TITLE_HEIGHT / 2,
        pinRadius,
        connectedPinIds.has(pin.id),
        theme
      );
    }
  }

  const bodyStartY = y + (node.isCondensed ? 0 : NODE_TITLE_HEIGHT);

  for (let i = 0; i < pinLayout.bodyInputPinIds.length; i++) {
    const pin = graph.pins[pinLayout.bodyInputPinIds[i]];
    if (!pin) {
      continue;
    }
    const cy = bodyStartY + PIN_TOP_PADDING + PIN_ROW_HEIGHT * i + PIN_ROW_HEIGHT / 2;
    const cx = x + PIN_ANCHOR_INSET;

    drawPinGlyph(ctx, pin, cx, cy, pinRadius, connectedPinIds.has(pin.id), theme);

    ctx.fillStyle = pinLabelColor;
    ctx.fillText(pin.label, cx + pinRadius + labelGap, cy);
  }

  for (let i = 0; i < pinLayout.bodyOutputPinIds.length; i++) {
    const pin = graph.pins[pinLayout.bodyOutputPinIds[i]];
    if (!pin) {
      continue;
    }
    const cy = bodyStartY + PIN_TOP_PADDING + PIN_ROW_HEIGHT * i + PIN_ROW_HEIGHT / 2;
    const cx = x + node.width - PIN_ANCHOR_INSET;

    drawPinGlyph(ctx, pin, cx, cy, pinRadius, connectedPinIds.has(pin.id), theme);

    const labelWidth = ctx.measureText(pin.label).width;
    ctx.fillStyle = pinLabelColor;
    ctx.fillText(pin.label, cx - pinRadius - labelGap - labelWidth, cy);
  }
}

function drawNodeTintOverlay(
  ctx: CanvasRenderingContext2D,
  node: NodeModel,
  x: number,
  y: number,
  theme: ReturnType<typeof getThemePreset>,
  borderRadius: number
): void {
  if (!node.tintColor) {
    return;
  }

  const tint = resolvePinColor(node.tintColor, theme);
  const overlayTop = y;
  const overlayHeight = node.isCondensed ? node.height : NODE_TITLE_HEIGHT;
  const gradient = ctx.createLinearGradient(x, overlayTop, x + node.width, overlayTop + overlayHeight);
  gradient.addColorStop(0, withAlpha(tint, theme.export.nodeTintAlphaStart));
  gradient.addColorStop(1, withAlpha(tint, theme.export.nodeTintAlphaEnd));

  const prevFillStyle = ctx.fillStyle;
  ctx.save();
  roundedRectPath(ctx, x, y, node.width, node.height, borderRadius);
  ctx.clip();
  ctx.fillStyle = gradient;
  ctx.fillRect(x, overlayTop, node.width, overlayHeight);
  ctx.restore();
  ctx.fillStyle = prevFillStyle;
}

function drawNodeTitle(
  ctx: CanvasRenderingContext2D,
  node: NodeModel,
  x: number,
  y: number,
  theme: ReturnType<typeof getThemePreset>
): void {
  ctx.fillStyle = theme.export.nodeTitle;
  ctx.font = `${layoutTokens.text.titleWeight} ${layoutTokens.text.titleSize}px ${layoutTokens.text.family}`;
  ctx.textBaseline = "middle";

  if (node.isCondensed) {
    const textWidth = ctx.measureText(node.title).width;
    ctx.fillText(node.title, x + (node.width - textWidth) / 2, y + node.height / 2 + 1);
    return;
  }

  const pinLayout = resolveNodePinLayout(node);
  const leftPad = pinLayout.titleInputPinId ? 30 : 12;
  const rightPad = pinLayout.titleOutputPinId ? 30 : 12;
  const maxTitleWidth = Math.max(0, node.width - leftPad - rightPad);
  const title = truncateText(ctx, node.title, maxTitleWidth);
  ctx.fillText(title, x + leftPad, y + NODE_TITLE_HEIGHT / 2 + 1);
}

function drawNodeDivider(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, dividerColor: string): void {
  ctx.strokeStyle = dividerColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + NODE_TITLE_HEIGHT);
  ctx.lineTo(x + width, y + NODE_TITLE_HEIGHT);
  ctx.stroke();
}

function resolveNodePinLayout(node: Pick<NodeModel, "isCondensed" | "showTitleInputPin" | "showTitleOutputPin" | "inputPinIds" | "outputPinIds">): NodePinLayout {
  const titleInputPinId = !node.isCondensed && node.showTitleInputPin ? node.inputPinIds[0] ?? null : null;
  const titleOutputPinId = !node.isCondensed && node.showTitleOutputPin ? node.outputPinIds[0] ?? null : null;
  return {
    titleInputPinId,
    titleOutputPinId,
    bodyInputPinIds: titleInputPinId ? node.inputPinIds.slice(1) : node.inputPinIds,
    bodyOutputPinIds: titleOutputPinId ? node.outputPinIds.slice(1) : node.outputPinIds
  };
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (maxWidth <= 0) {
    return "...";
  }
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  const ellipsis = "...";
  if (ctx.measureText(ellipsis).width > maxWidth) {
    return ellipsis;
  }
  let trimmed = text;
  while (trimmed.length > 0 && ctx.measureText(`${trimmed}${ellipsis}`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}${ellipsis}`;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const resolvedRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  if (resolvedRadius <= 0) {
    ctx.rect(x, y, width, height);
    ctx.closePath();
    return;
  }
  ctx.moveTo(x + resolvedRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, resolvedRadius);
  ctx.arcTo(x + width, y + height, x, y + height, resolvedRadius);
  ctx.arcTo(x, y + height, x, y, resolvedRadius);
  ctx.arcTo(x, y, x + width, y, resolvedRadius);
  ctx.closePath();
}

function drawNodeShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  style: NodeRenderStyle
): void {
  if (style.shadowColor === "transparent") {
    return;
  }
  if (style.shadowOffsetX === 0 && style.shadowOffsetY === 0 && style.shadowBlur === 0) {
    return;
  }
  const prevFilter = "filter" in ctx ? ctx.filter : undefined;
  if (style.shadowBlur > 0 && "filter" in ctx) {
    ctx.filter = `blur(${style.shadowBlur}px)`;
  }
  ctx.fillStyle = style.shadowColor;
  roundedRectPath(ctx, x + style.shadowOffsetX, y + style.shadowOffsetY, width, height, style.radius);
  ctx.fill();
  if ("filter" in ctx) {
    ctx.filter = prevFilter ?? "none";
  }
}

function withAlpha(color: string, alpha: number): string {
  const match = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) {
    return color;
  }
  const hex = match[1];
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawPinGlyph(
  ctx: CanvasRenderingContext2D,
  pin: Pick<PinModel, "shape" | "color">,
  cx: number,
  cy: number,
  radius: number,
  connected: boolean,
  theme: ReturnType<typeof getThemePreset>
): void {
  const resolvedColor = resolvePinColor(pin.color, theme);
  ctx.beginPath();
  tracePinShapePath(ctx, pin.shape, cx, cy, radius);
  if (connected) {
    ctx.fillStyle = resolvedColor;
    ctx.fill();
  }
  ctx.strokeStyle = resolvedColor;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function getConnectedPinIds(graph: GraphModel): Set<string> {
  const ids = new Set<string>();
  for (const edge of Object.values(graph.edges)) {
    ids.add(edge.fromPinId);
    ids.add(edge.toPinId);
  }
  return ids;
}

function resolvePinColor(color: PinColor, theme: ReturnType<typeof getThemePreset>): string {
  return theme.export.pinColors[color];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke: string,
  borderWidth: number
): void {
  roundedRectPath(ctx, x, y, width, height, radius);

  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = borderWidth;
  ctx.stroke();
}

function resolveThemeNodeRenderStyle(theme: ReturnType<typeof getThemePreset>): NodeRenderStyle {
  return {
    radius: theme.export.nodeRadius,
    borderWidth: theme.export.nodeBorderWidth,
    shadowOffsetX: theme.export.nodeShadowOffsetX,
    shadowOffsetY: theme.export.nodeShadowOffsetY,
    shadowBlur: theme.export.nodeShadowBlur,
    shadowColor: theme.export.nodeShadowColor
  };
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
  computeOutputMetrics,
  drawPinGlyph,
  drawNodeShadow,
  tracePinShapePath,
  getConnectedPinIds,
  resolvePinColor,
  resolveThemeNodeRenderStyle,
  resolveNodePinLayout,
  truncateText,
  withAlpha
};
