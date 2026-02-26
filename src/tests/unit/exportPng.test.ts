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

  it("resolves title pin and body pin layout for expanded nodes", () => {
    const layout = __testables.resolveNodePinLayout({
      isCondensed: false,
      showTitleInputPin: true,
      showTitleOutputPin: true,
      inputPinIds: ["in-a", "in-b"],
      outputPinIds: ["out-a", "out-b"]
    });
    expect(layout.titleInputPinId).toBe("in-a");
    expect(layout.titleOutputPinId).toBe("out-a");
    expect(layout.bodyInputPinIds).toEqual(["in-b"]);
    expect(layout.bodyOutputPinIds).toEqual(["out-b"]);
  });

  it("keeps all pins in body for condensed nodes", () => {
    const layout = __testables.resolveNodePinLayout({
      isCondensed: true,
      showTitleInputPin: true,
      showTitleOutputPin: true,
      inputPinIds: ["in-a", "in-b"],
      outputPinIds: ["out-a", "out-b"]
    });
    expect(layout.titleInputPinId).toBeNull();
    expect(layout.titleOutputPinId).toBeNull();
    expect(layout.bodyInputPinIds).toEqual(["in-a", "in-b"]);
    expect(layout.bodyOutputPinIds).toEqual(["out-a", "out-b"]);
  });

  it("applies alpha to hex colors for tint overlays", () => {
    expect(__testables.withAlpha("#69a8ff", 0.34)).toBe("rgba(105, 168, 255, 0.34)");
    expect(__testables.withAlpha("#5FE8FF", 0.08)).toBe("rgba(95, 232, 255, 0.08)");
    expect(__testables.withAlpha("rgb(1, 2, 3)", 0.5)).toBe("rgb(1, 2, 3)");
  });

  it("truncates long titles with ellipsis when needed", () => {
    const ctx = {
      measureText: (text: string) => ({ width: text.length * 10 })
    } as CanvasRenderingContext2D;

    expect(__testables.truncateText(ctx, "Hello", 100)).toBe("Hello");
    expect(__testables.truncateText(ctx, "HelloWorld", 55)).toBe("He...");
  });

  it("resolves node render style from theme export tokens", () => {
    const midnightStyle = __testables.resolveThemeNodeRenderStyle(getThemePreset("midnight"));
    expect(midnightStyle.radius).toBe(10);
    expect(midnightStyle.borderWidth).toBe(1);

    const brutalStyle = __testables.resolveThemeNodeRenderStyle(getThemePreset("brutal"));
    expect(brutalStyle.radius).toBe(0);
    expect(brutalStyle.borderWidth).toBe(3);
    expect(brutalStyle.shadowOffsetX).toBe(8);
    expect(brutalStyle.shadowOffsetY).toBe(8);
    expect(brutalStyle.shadowBlur).toBe(0);

    const brutalDarkStyle = __testables.resolveThemeNodeRenderStyle(getThemePreset("brutalDark"));
    expect(brutalDarkStyle.radius).toBe(0);
    expect(brutalDarkStyle.borderWidth).toBe(3);
    expect(brutalDarkStyle.shadowOffsetX).toBe(8);
    expect(brutalDarkStyle.shadowOffsetY).toBe(8);
    expect(brutalDarkStyle.shadowBlur).toBe(0);
  });

  it("skips drawing node shadow when style does not offset or blur", () => {
    const ctx = makeMockCanvasContext();
    __testables.drawNodeShadow(ctx, 10, 20, 140, 80, {
      radius: 10,
      borderWidth: 1,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
      shadowColor: "rgba(0, 0, 0, 0.4)"
    });
    expect(ctx.fill).not.toHaveBeenCalled();
  });

  it("draws node shadow with preset shadow style", () => {
    const ctx = makeMockCanvasContext();
    const style = __testables.resolveThemeNodeRenderStyle(getThemePreset("brutal"));
    __testables.drawNodeShadow(ctx, 10, 20, 140, 80, style);
    expect(ctx.fill).toHaveBeenCalledTimes(1);
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
    arcTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    filter: "none",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1
  } as unknown as CanvasRenderingContext2D;
}
