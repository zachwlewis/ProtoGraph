import { __testables } from "../../export/exportPng";

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
});
