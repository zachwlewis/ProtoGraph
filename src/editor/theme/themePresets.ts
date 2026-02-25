import type { ThemePresetId } from "../model/types";
import type { PinColor } from "../model/types";

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
    pinColors: Record<PinColor, string>;
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
      "--grid": "rgba(150, 170, 220, 0.1)",
      "--text": "#d9e2f2",
      "--muted": "#93a2bd",
      "--node-bg": "#1f2530",
      "--node-border": "#3c495e",
      "--node-title": "#c8d9ff",
      "--node-divider": "#303a4a",
      "--pin-label": "#bbcae5",
      "--selection": "#ff8f2d",
      "--wire-color": "#c8d2e2",
      "--pin-color-white": "#eef4ff",
      "--pin-color-red": "#ff6b7f",
      "--pin-color-blue": "#69a8ff",
      "--pin-color-green": "#58d693",
      "--pin-color-purple": "#b996ff",
      "--pin-color-yellow": "#ffd36b",
      "--pin-color-cyan": "#5fe8ff",
      "--pin-color-magenta": "#ff81dc"
    },
    export: {
      canvasBg: "#0f1218",
      grid: "rgba(150, 170, 220, 0.1)",
      wire: "#c8d2e2",
      nodeFill: "#1f2530",
      nodeStroke: "#3c495e",
      nodeTitle: "#c8d9ff",
      pinLabel: "#bbcae5",
      divider: "#303a4a",
      frameStroke: "rgba(125, 165, 220, 0.52)",
      frameTitle: "rgba(224, 237, 255, 0.93)",
      pinColors: {
        white: "#eef4ff",
        red: "#ff6b7f",
        blue: "#69a8ff",
        green: "#58d693",
        purple: "#b996ff",
        yellow: "#ffd36b",
        cyan: "#5fe8ff",
        magenta: "#ff81dc"
      }
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
      "--grid": "rgba(98, 174, 255, 0.16)",
      "--text": "#d6ebff",
      "--muted": "#91b7d6",
      "--node-bg": "#102540",
      "--node-border": "#3f74a7",
      "--node-title": "#d9edff",
      "--node-divider": "#2e567d",
      "--pin-label": "#bfd9f5",
      "--selection": "#ffb650",
      "--wire-color": "#c7def6",
      "--pin-color-white": "#f2f8ff",
      "--pin-color-red": "#ff6f7a",
      "--pin-color-blue": "#52b6ff",
      "--pin-color-green": "#3de4a4",
      "--pin-color-purple": "#b987ff",
      "--pin-color-yellow": "#ffe06b",
      "--pin-color-cyan": "#45f1ff",
      "--pin-color-magenta": "#ff73d8"
    },
    export: {
      canvasBg: "#071427",
      grid: "rgba(98, 174, 255, 0.16)",
      wire: "#c7def6",
      nodeFill: "#102540",
      nodeStroke: "#3f74a7",
      nodeTitle: "#d9edff",
      pinLabel: "#bfd9f5",
      divider: "#2e567d",
      frameStroke: "rgba(121, 187, 255, 0.62)",
      frameTitle: "rgba(223, 241, 255, 0.94)",
      pinColors: {
        white: "#f2f8ff",
        red: "#ff6f7a",
        blue: "#52b6ff",
        green: "#3de4a4",
        purple: "#b987ff",
        yellow: "#ffe06b",
        cyan: "#45f1ff",
        magenta: "#ff73d8"
      }
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
      "--grid": "rgba(183, 197, 216, 0.1)",
      "--text": "#e1e7ef",
      "--muted": "#98a5b8",
      "--node-bg": "#252a33",
      "--node-border": "#4f5a6d",
      "--node-title": "#e4ebf8",
      "--node-divider": "#3d4655",
      "--pin-label": "#c3cddd",
      "--selection": "#ff9a42",
      "--wire-color": "#d8dee8",
      "--pin-color-white": "#eceff6",
      "--pin-color-red": "#e67a84",
      "--pin-color-blue": "#78a8df",
      "--pin-color-green": "#71be93",
      "--pin-color-purple": "#af95dd",
      "--pin-color-yellow": "#d7c070",
      "--pin-color-cyan": "#6fc6d6",
      "--pin-color-magenta": "#d68dbd"
    },
    export: {
      canvasBg: "#121519",
      grid: "rgba(183, 197, 216, 0.1)",
      wire: "#d8dee8",
      nodeFill: "#252a33",
      nodeStroke: "#4f5a6d",
      nodeTitle: "#e4ebf8",
      pinLabel: "#c3cddd",
      divider: "#3d4655",
      frameStroke: "rgba(171, 189, 214, 0.5)",
      frameTitle: "rgba(236, 241, 248, 0.95)",
      pinColors: {
        white: "#eceff6",
        red: "#e67a84",
        blue: "#78a8df",
        green: "#71be93",
        purple: "#af95dd",
        yellow: "#d7c070",
        cyan: "#6fc6d6",
        magenta: "#d68dbd"
      }
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
      "--grid": "rgba(170, 174, 182, 0.1)",
      "--text": "#ececec",
      "--muted": "#b4b7bd",
      "--node-bg": "#2e3033",
      "--node-border": "#5c6067",
      "--node-title": "#f0f1f4",
      "--node-divider": "#4b4f56",
      "--pin-label": "#d4d8e2",
      "--selection": "#ff9f3d",
      "--wire-color": "#d7dbe4",
      "--pin-color-white": "#e7e9ec",
      "--pin-color-red": "#ee7e77",
      "--pin-color-blue": "#73a6d7",
      "--pin-color-green": "#6ac48b",
      "--pin-color-purple": "#b494d4",
      "--pin-color-yellow": "#d9c16f",
      "--pin-color-cyan": "#69c6cc",
      "--pin-color-magenta": "#cf8fbd"
    },
    export: {
      canvasBg: "#1b1c1e",
      grid: "rgba(170, 174, 182, 0.1)",
      wire: "#d7dbe4",
      nodeFill: "#2e3033",
      nodeStroke: "#5c6067",
      nodeTitle: "#f0f1f4",
      pinLabel: "#d4d8e2",
      divider: "#4b4f56",
      frameStroke: "rgba(198, 202, 210, 0.55)",
      frameTitle: "rgba(241, 243, 247, 0.96)",
      pinColors: {
        white: "#e7e9ec",
        red: "#ee7e77",
        blue: "#73a6d7",
        green: "#6ac48b",
        purple: "#b494d4",
        yellow: "#d9c16f",
        cyan: "#69c6cc",
        magenta: "#cf8fbd"
      }
    }
  }
};

export const themePresetOrder: ThemePresetId[] = ["midnight", "blueprint", "slate", "blender"];

export function getThemePreset(id: ThemePresetId): ThemePreset {
  return themePresets[id];
}
