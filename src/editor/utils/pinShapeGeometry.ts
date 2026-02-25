import type { PinShape } from "../model/types";

const NORMALIZED_RADIUS = 30;

const SHAPE_POINTS: Record<Exclude<PinShape, "circle">, ReadonlyArray<readonly [number, number]>> = {
  diamond: [
    [50, 20],
    [80, 50],
    [50, 80],
    [20, 50]
  ],
  square: [
    [20, 20],
    [80, 20],
    [80, 80],
    [20, 80]
  ],
  execution: [
    [20, 20],
    [58, 20],
    [80, 50],
    [58, 80],
    [20, 80]
  ]
};

export function getPinShapeScale(shape: PinShape): { x: number; y: number } {
  return { x: 1, y: 1 };
}

export function getPinShapeSvgPoints(shape: Exclude<PinShape, "circle">): string {
  return SHAPE_POINTS[shape].map(([x, y]) => `${x},${y}`).join(" ");
}

export function tracePinShapePath(
  ctx: CanvasRenderingContext2D,
  shape: PinShape,
  cx: number,
  cy: number,
  radius: number
): void {
  if (shape === "circle") {
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    return;
  }

  const { x: scaleX, y: scaleY } = getPinShapeScale(shape);
  const halfWidth = radius * scaleX;
  const halfHeight = radius * scaleY;
  const points = SHAPE_POINTS[shape];

  for (let i = 0; i < points.length; i++) {
    const [nx, ny] = points[i];
    const x = cx + ((nx - 50) / NORMALIZED_RADIUS) * halfWidth;
    const y = cy + ((ny - 50) / NORMALIZED_RADIUS) * halfHeight;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}
