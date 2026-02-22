import { getThemePreset, themePresetOrder, themePresets } from "../../editor/theme/themePresets";

describe("theme presets", () => {
  it("includes all expected preset ids", () => {
    expect(themePresetOrder).toEqual(["midnight", "blueprint", "slate", "blender"]);
    expect(Object.keys(themePresets).sort()).toEqual(["blender", "blueprint", "midnight", "slate"]);
  });

  it("maps preset ids to css and export tokens", () => {
    const preset = getThemePreset("blender");
    expect(preset.id).toBe("blender");
    expect(preset.cssVars["--canvas-bg"]).toBeTruthy();
    expect(preset.cssVars["--wire-color"]).toBeTruthy();
    expect(preset.export.canvasBg).toBeTruthy();
    expect(preset.export.wire).toBeTruthy();
  });
});
