import { getThemePreset, themePresetOrder, themePresets } from "../../editor/theme/themePresets";

describe("theme presets", () => {
  it("includes all expected preset ids", () => {
    expect(themePresetOrder).toEqual(["midnight", "blueprint", "slate", "blender", "brutal", "brutalDark"]);
    expect(Object.keys(themePresets).sort()).toEqual(["blender", "blueprint", "brutal", "brutalDark", "midnight", "slate"]);
  });

  it("maps preset ids to css and export tokens", () => {
    const preset = getThemePreset("blender");
    expect(preset.id).toBe("blender");
    expect(preset.cssVars["--canvas-bg"]).toBeTruthy();
    expect(preset.cssVars["--wire-color"]).toBeTruthy();
    expect(preset.cssVars["--node-radius"]).toBeTruthy();
    expect(preset.export.canvasBg).toBeTruthy();
    expect(preset.export.wire).toBeTruthy();
    expect(preset.ui.nodeShadow).toBeTruthy();
    expect(preset.export.nodeBorderWidth).toBeGreaterThan(0);
  });

  it("defines brutal neobrutalist node tokens", () => {
    const brutalLight = getThemePreset("brutal");
    expect(brutalLight.id).toBe("brutal");
    expect(brutalLight.label).toBe("Brutal Light");
    expect(brutalLight.ui.nodeRadius).toBe(0);
    expect(brutalLight.ui.nodeBorderWidth).toBe(3);
    expect(brutalLight.export.nodeRadius).toBe(0);
    expect(brutalLight.export.nodeBorderWidth).toBe(3);
    expect(brutalLight.export.nodeShadowOffsetX).toBe(8);
    expect(brutalLight.export.nodeShadowOffsetY).toBe(8);

    const brutalDark = getThemePreset("brutalDark");
    expect(brutalDark.id).toBe("brutalDark");
    expect(brutalDark.label).toBe("Brutal Dark");
    expect(brutalDark.ui.nodeRadius).toBe(0);
    expect(brutalDark.ui.nodeBorderWidth).toBe(3);
    expect(brutalDark.export.nodeRadius).toBe(0);
    expect(brutalDark.export.nodeBorderWidth).toBe(3);
    expect(brutalDark.export.nodeShadowOffsetX).toBe(8);
    expect(brutalDark.export.nodeShadowOffsetY).toBe(8);
  });
});
