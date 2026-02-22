import type { ThemePresetId } from "../model/types";

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  cssVars: Record<`--${string}`, string>;
  export: {
    canvasBg: string;
    grid: string;
    wire: string;
    nodeFill: string;
    nodeStroke: string;
    nodeTitle: string;
    pinLabel: string;
    divider: string;
    frameStroke: string;
    frameTitle: string;
  };
};

export const themePresets: Record<ThemePresetId, ThemePreset> = {
  midnight: {
    id: "midnight",
    label: "Midnight",
    cssVars: {
      "--bg": "#11141b",
      "--panel": "#1a1f28",
      "--panel-border": "#2b3342",
      "--toolbar-bg": "#1f2631",
      "--canvas-bg": "#0f1218",
      "--grid": "rgba(150, 170, 220, 0.15)",
      "--text": "#d9e2f2",
      "--muted": "#93a2bd",
      "--node-bg": "#1f2530",
      "--node-border": "#3c495e",
      "--node-title": "#c8d9ff",
      "--node-divider": "#303a4a",
      "--pin-label": "#bbcae5",
      "--selection": "#ff8f2d",
      "--wire-color": "#c8d2e2"
    },
    export: {
      canvasBg: "#0f1218",
      grid: "rgba(150, 170, 220, 0.15)",
      wire: "#c8d2e2",
      nodeFill: "#1f2530",
      nodeStroke: "#3c495e",
      nodeTitle: "#c8d9ff",
      pinLabel: "#bbcae5",
      divider: "#303a4a",
      frameStroke: "rgba(125, 165, 220, 0.52)",
      frameTitle: "rgba(224, 237, 255, 0.93)"
    }
  },
  blueprint: {
    id: "blueprint",
    label: "Blueprint",
    cssVars: {
      "--bg": "#0a1a2f",
      "--panel": "#10233a",
      "--panel-border": "#24486d",
      "--toolbar-bg": "#153051",
      "--canvas-bg": "#071427",
      "--grid": "rgba(98, 174, 255, 0.26)",
      "--text": "#d6ebff",
      "--muted": "#91b7d6",
      "--node-bg": "#102540",
      "--node-border": "#3f74a7",
      "--node-title": "#d9edff",
      "--node-divider": "#2e567d",
      "--pin-label": "#bfd9f5",
      "--selection": "#ffb650",
      "--wire-color": "#c7def6"
    },
    export: {
      canvasBg: "#071427",
      grid: "rgba(98, 174, 255, 0.26)",
      wire: "#c7def6",
      nodeFill: "#102540",
      nodeStroke: "#3f74a7",
      nodeTitle: "#d9edff",
      pinLabel: "#bfd9f5",
      divider: "#2e567d",
      frameStroke: "rgba(121, 187, 255, 0.62)",
      frameTitle: "rgba(223, 241, 255, 0.94)"
    }
  },
  slate: {
    id: "slate",
    label: "Slate",
    cssVars: {
      "--bg": "#15171a",
      "--panel": "#1d2126",
      "--panel-border": "#3b434f",
      "--toolbar-bg": "#262d35",
      "--canvas-bg": "#121519",
      "--grid": "rgba(183, 197, 216, 0.15)",
      "--text": "#e1e7ef",
      "--muted": "#98a5b8",
      "--node-bg": "#252a33",
      "--node-border": "#4f5a6d",
      "--node-title": "#e4ebf8",
      "--node-divider": "#3d4655",
      "--pin-label": "#c3cddd",
      "--selection": "#ff9a42",
      "--wire-color": "#d8dee8"
    },
    export: {
      canvasBg: "#121519",
      grid: "rgba(183, 197, 216, 0.15)",
      wire: "#d8dee8",
      nodeFill: "#252a33",
      nodeStroke: "#4f5a6d",
      nodeTitle: "#e4ebf8",
      pinLabel: "#c3cddd",
      divider: "#3d4655",
      frameStroke: "rgba(171, 189, 214, 0.5)",
      frameTitle: "rgba(236, 241, 248, 0.95)"
    }
  },
  blender: {
    id: "blender",
    label: "Blender",
    cssVars: {
      "--bg": "#1e1e1f",
      "--panel": "#252628",
      "--panel-border": "#424447",
      "--toolbar-bg": "#2f3135",
      "--canvas-bg": "#1b1c1e",
      "--grid": "rgba(170, 174, 182, 0.16)",
      "--text": "#ececec",
      "--muted": "#b4b7bd",
      "--node-bg": "#2e3033",
      "--node-border": "#5c6067",
      "--node-title": "#f0f1f4",
      "--node-divider": "#4b4f56",
      "--pin-label": "#d4d8e2",
      "--selection": "#ff9f3d",
      "--wire-color": "#d7dbe4"
    },
    export: {
      canvasBg: "#1b1c1e",
      grid: "rgba(170, 174, 182, 0.16)",
      wire: "#d7dbe4",
      nodeFill: "#2e3033",
      nodeStroke: "#5c6067",
      nodeTitle: "#f0f1f4",
      pinLabel: "#d4d8e2",
      divider: "#4b4f56",
      frameStroke: "rgba(198, 202, 210, 0.55)",
      frameTitle: "rgba(241, 243, 247, 0.96)"
    }
  }
};

export const themePresetOrder: ThemePresetId[] = ["midnight", "blueprint", "slate", "blender"];

export function getThemePreset(id: ThemePresetId): ThemePreset {
  return themePresets[id];
}
