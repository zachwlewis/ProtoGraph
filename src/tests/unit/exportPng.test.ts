import { __testables } from "../../export/exportPng";
import { makeGraph, createNode, connectPins } from "../../editor/model/graphMutations";
import { getThemePreset } from "../../editor/theme/themePresets";

describe("exportPng helpers", () => {
  it("computes output size and offsets with variable margin", () => {
    const metrics = __testables.computeOutputMetrics({ x: 50, y: 100, width: 400, height: 300 }, 24);

    expect(metrics.outputWidth).toBe(448);
    expect(metrics.outputHeight).toBe(348);
    expect(metrics.offsetX).toBe(-26);
    expect(metrics.offsetY).toBe(-76);
  });

  it("resolves viewport/full/framed filenames", () => {
    expect(__testables.resolvePngFilename("graph-a", "viewport", false)).toBe("graph-a-viewport.png");
    expect(__testables.resolvePngFilename("graph-a", "full", false)).toBe("graph-a-full.png");
    expect(__testables.resolvePngFilename("graph-a", "full", true)).toBe("graph-a-framed.png");
  });

  it("collects connected pin ids from edges", () => {
    const base = makeGraph();
    const [withA, a] = createNode(base, { x: 0, y: 0 });
    const [withB, b] = createNode(withA, { x: 200, y: 0 });
    const fromPinId = withB.nodes[a].outputPinIds[0];
    const toPinId = withB.nodes[b].inputPinIds[0];
    const result = connectPins(withB, fromPinId, toPinId);
    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected successful connection");
    }

    const connected = __testables.getConnectedPinIds(result.graph);
    expect(connected.has(fromPinId)).toBe(true);
    expect(connected.has(toPinId)).toBe(true);
  });

  it("draws non-circle pin helpers and uses fill only for connected pins", () => {
    const theme = getThemePreset("midnight");
    const unconnectedCtx = makeMockCanvasContext();
    __testables.drawPinGlyph(
      unconnectedCtx,
      { shape: "execution", color: "blue" },
      50,
      60,
      8,
      false,
      theme
    );
    expect(unconnectedCtx.lineTo).toHaveBeenCalled();
    expect(unconnectedCtx.fill).not.toHaveBeenCalled();
    expect(unconnectedCtx.stroke).toHaveBeenCalled();

    const connectedCtx = makeMockCanvasContext();
    __testables.drawPinGlyph(
      connectedCtx,
      { shape: "diamond", color: "blue" },
      50,
      60,
      8,
      true,
      theme
    );
    expect(connectedCtx.fill).toHaveBeenCalledTimes(1);
    expect(connectedCtx.stroke).toHaveBeenCalledTimes(1);
  });
});

function makeMockCanvasContext(): CanvasRenderingContext2D {
  return {
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    rect: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1
  } as unknown as CanvasRenderingContext2D;
}
