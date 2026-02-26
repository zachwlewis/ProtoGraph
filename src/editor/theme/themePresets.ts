import type { ThemePresetId } from "../model/types";
import type { PinColor } from "../model/types";

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  cssVars: Record<`--${string}`, string>;
  ui: {
    nodeRadius: number;
    nodeBorderWidth: number;
    nodeShadow: string;
    nodeSelectedShadow: string;
  };
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
    nodeRadius: number;
    nodeBorderWidth: number;
    nodeShadowOffsetX: number;
    nodeShadowOffsetY: number;
    nodeShadowBlur: number;
    nodeShadowColor: string;
    nodeTintAlphaStart: number;
    nodeTintAlphaEnd: number;
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
      "--node-radius": "10px",
      "--node-border-width": "1px",
      "--node-shadow": "0 4px 24px rgba(0, 0, 0, 0.4)",
      "--node-selected-shadow": "0 0 0 2px rgba(255, 143, 45, 0.72), 0 0 22px rgba(255, 116, 0, 0.52), 0 0 36px rgba(255, 116, 0, 0.28)",
      "--pin-color-white": "#eef4ff",
      "--pin-color-red": "#ff6b7f",
      "--pin-color-blue": "#69a8ff",
      "--pin-color-green": "#58d693",
      "--pin-color-purple": "#b996ff",
      "--pin-color-yellow": "#ffd36b",
      "--pin-color-cyan": "#5fe8ff",
      "--pin-color-magenta": "#ff81dc"
    },
    ui: {
      nodeRadius: 10,
      nodeBorderWidth: 1,
      nodeShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
      nodeSelectedShadow: "0 0 0 2px rgba(255, 143, 45, 0.72), 0 0 22px rgba(255, 116, 0, 0.52), 0 0 36px rgba(255, 116, 0, 0.28)"
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
      nodeRadius: 10,
      nodeBorderWidth: 1,
      nodeShadowOffsetX: 0,
      nodeShadowOffsetY: 4,
      nodeShadowBlur: 24,
      nodeShadowColor: "rgba(0, 0, 0, 0.4)",
      nodeTintAlphaStart: 0.34,
      nodeTintAlphaEnd: 0.08,
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
      "--node-radius": "10px",
      "--node-border-width": "1px",
      "--node-shadow": "0 4px 24px rgba(0, 0, 0, 0.4)",
      "--node-selected-shadow": "0 0 0 2px rgba(255, 182, 80, 0.74), 0 0 22px rgba(255, 148, 58, 0.5), 0 0 36px rgba(255, 148, 58, 0.26)",
      "--pin-color-white": "#f2f8ff",
      "--pin-color-red": "#ff6f7a",
      "--pin-color-blue": "#52b6ff",
      "--pin-color-green": "#3de4a4",
      "--pin-color-purple": "#b987ff",
      "--pin-color-yellow": "#ffe06b",
      "--pin-color-cyan": "#45f1ff",
      "--pin-color-magenta": "#ff73d8"
    },
    ui: {
      nodeRadius: 10,
      nodeBorderWidth: 1,
      nodeShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
      nodeSelectedShadow: "0 0 0 2px rgba(255, 182, 80, 0.74), 0 0 22px rgba(255, 148, 58, 0.5), 0 0 36px rgba(255, 148, 58, 0.26)"
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
      nodeRadius: 10,
      nodeBorderWidth: 1,
      nodeShadowOffsetX: 0,
      nodeShadowOffsetY: 4,
      nodeShadowBlur: 24,
      nodeShadowColor: "rgba(0, 0, 0, 0.4)",
      nodeTintAlphaStart: 0.34,
      nodeTintAlphaEnd: 0.08,
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
      "--node-radius": "10px",
      "--node-border-width": "1px",
      "--node-shadow": "0 4px 24px rgba(0, 0, 0, 0.4)",
      "--node-selected-shadow": "0 0 0 2px rgba(255, 154, 66, 0.7), 0 0 22px rgba(255, 118, 34, 0.48), 0 0 36px rgba(255, 118, 34, 0.26)",
      "--pin-color-white": "#eceff6",
      "--pin-color-red": "#e67a84",
      "--pin-color-blue": "#78a8df",
      "--pin-color-green": "#71be93",
      "--pin-color-purple": "#af95dd",
      "--pin-color-yellow": "#d7c070",
      "--pin-color-cyan": "#6fc6d6",
      "--pin-color-magenta": "#d68dbd"
    },
    ui: {
      nodeRadius: 10,
      nodeBorderWidth: 1,
      nodeShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
      nodeSelectedShadow: "0 0 0 2px rgba(255, 154, 66, 0.7), 0 0 22px rgba(255, 118, 34, 0.48), 0 0 36px rgba(255, 118, 34, 0.26)"
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
      nodeRadius: 10,
      nodeBorderWidth: 1,
      nodeShadowOffsetX: 0,
      nodeShadowOffsetY: 4,
      nodeShadowBlur: 24,
      nodeShadowColor: "rgba(0, 0, 0, 0.4)",
      nodeTintAlphaStart: 0.34,
      nodeTintAlphaEnd: 0.08,
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
      "--node-radius": "10px",
      "--node-border-width": "1px",
      "--node-shadow": "0 4px 24px rgba(0, 0, 0, 0.4)",
      "--node-selected-shadow": "0 0 0 2px rgba(255, 159, 61, 0.72), 0 0 22px rgba(255, 129, 51, 0.5), 0 0 36px rgba(255, 129, 51, 0.25)",
      "--pin-color-white": "#e7e9ec",
      "--pin-color-red": "#ee7e77",
      "--pin-color-blue": "#73a6d7",
      "--pin-color-green": "#6ac48b",
      "--pin-color-purple": "#b494d4",
      "--pin-color-yellow": "#d9c16f",
      "--pin-color-cyan": "#69c6cc",
      "--pin-color-magenta": "#cf8fbd"
    },
    ui: {
      nodeRadius: 10,
      nodeBorderWidth: 1,
      nodeShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
      nodeSelectedShadow: "0 0 0 2px rgba(255, 159, 61, 0.72), 0 0 22px rgba(255, 129, 51, 0.5), 0 0 36px rgba(255, 129, 51, 0.25)"
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
      nodeRadius: 10,
      nodeBorderWidth: 1,
      nodeShadowOffsetX: 0,
      nodeShadowOffsetY: 4,
      nodeShadowBlur: 24,
      nodeShadowColor: "rgba(0, 0, 0, 0.4)",
      nodeTintAlphaStart: 0.34,
      nodeTintAlphaEnd: 0.08,
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
  },
  brutal: {
    id: "brutal",
    label: "Brutal Light",
    cssVars: {
      "--bg": "#f6f0dc",
      "--panel": "#fff7dd",
      "--panel-border": "#101010",
      "--toolbar-bg": "#ffd84a",
      "--canvas-bg": "#fff2bf",
      "--grid": "rgba(16, 16, 16, 0.16)",
      "--text": "#0d0d0d",
      "--muted": "#2f2f2f",
      "--node-bg": "#ffffff",
      "--node-border": "#0f0f0f",
      "--node-title": "#0f0f0f",
      "--node-divider": "#0f0f0f",
      "--pin-label": "#0f0f0f",
      "--selection": "#ff2d55",
      "--wire-color": "#101010",
      "--node-radius": "0px",
      "--node-border-width": "3px",
      "--node-shadow": "8px 8px 0 #101010",
      "--node-selected-shadow": "0 0 0 3px rgba(255, 45, 85, 0.96), 10px 10px 0 #101010",
      "--node-tint-gradient-opacity": "0",
      "--node-tint-solid-opacity": "1",
      "--pin-color-white": "#d9e6ff",
      "--pin-color-red": "#ff1744",
      "--pin-color-blue": "#0059ff",
      "--pin-color-green": "#00e676",
      "--pin-color-purple": "#8c31ff",
      "--pin-color-yellow": "#ffe600",
      "--pin-color-cyan": "#00e5ff",
      "--pin-color-magenta": "#ff00b8"
    },
    ui: {
      nodeRadius: 0,
      nodeBorderWidth: 3,
      nodeShadow: "8px 8px 0 #101010",
      nodeSelectedShadow: "0 0 0 3px rgba(255, 45, 85, 0.96), 10px 10px 0 #101010"
    },
    export: {
      canvasBg: "#fff2bf",
      grid: "rgba(16, 16, 16, 0.16)",
      wire: "#101010",
      nodeFill: "#ffffff",
      nodeStroke: "#0f0f0f",
      nodeTitle: "#0f0f0f",
      pinLabel: "#0f0f0f",
      divider: "#0f0f0f",
      frameStroke: "#0f0f0f",
      frameTitle: "#0f0f0f",
      nodeRadius: 0,
      nodeBorderWidth: 3,
      nodeShadowOffsetX: 8,
      nodeShadowOffsetY: 8,
      nodeShadowBlur: 0,
      nodeShadowColor: "rgba(16, 16, 16, 1)",
      nodeTintAlphaStart: 1,
      nodeTintAlphaEnd: 1,
      pinColors: {
        white: "#d9e6ff",
        red: "#ff1744",
        blue: "#0059ff",
        green: "#00e676",
        purple: "#8c31ff",
        yellow: "#ffe600",
        cyan: "#00e5ff",
        magenta: "#ff00b8"
      }
    }
  },
  brutalDark: {
    id: "brutalDark",
    label: "Brutal Dark",
    cssVars: {
      "--bg": "#141414",
      "--panel": "#181818",
      "--panel-border": "#f2f2f2",
      "--toolbar-bg": "#1f1f1f",
      "--canvas-bg": "#171717",
      "--grid": "rgba(242, 242, 242, 0.16)",
      "--text": "#f5f5f5",
      "--muted": "#b6b6b6",
      "--node-bg": "#0f0f0f",
      "--node-border": "#f5f5f5",
      "--node-title": "#f5f5f5",
      "--node-divider": "#f5f5f5",
      "--pin-label": "#f5f5f5",
      "--selection": "#00e5ff",
      "--wire-color": "#ebebeb",
      "--node-radius": "0px",
      "--node-border-width": "3px",
      "--node-shadow": "8px 8px 0 #000000",
      "--node-selected-shadow": "0 0 0 3px rgba(0, 229, 255, 0.96), 10px 10px 0 #000000",
      "--node-tint-gradient-opacity": "0",
      "--node-tint-solid-opacity": "1",
      "--pin-color-white": "#ffffff",
      "--pin-color-red": "#ff335f",
      "--pin-color-blue": "#2e6bff",
      "--pin-color-green": "#24f28b",
      "--pin-color-purple": "#a155ff",
      "--pin-color-yellow": "#ffe74a",
      "--pin-color-cyan": "#2bf0ff",
      "--pin-color-magenta": "#ff3bd2"
    },
    ui: {
      nodeRadius: 0,
      nodeBorderWidth: 3,
      nodeShadow: "8px 8px 0 #000000",
      nodeSelectedShadow: "0 0 0 3px rgba(0, 229, 255, 0.96), 10px 10px 0 #000000"
    },
    export: {
      canvasBg: "#171717",
      grid: "rgba(242, 242, 242, 0.16)",
      wire: "#ebebeb",
      nodeFill: "#0f0f0f",
      nodeStroke: "#f5f5f5",
      nodeTitle: "#f5f5f5",
      pinLabel: "#f5f5f5",
      divider: "#f5f5f5",
      frameStroke: "#f5f5f5",
      frameTitle: "#f5f5f5",
      nodeRadius: 0,
      nodeBorderWidth: 3,
      nodeShadowOffsetX: 8,
      nodeShadowOffsetY: 8,
      nodeShadowBlur: 0,
      nodeShadowColor: "rgba(0, 0, 0, 1)",
      nodeTintAlphaStart: 1,
      nodeTintAlphaEnd: 1,
      pinColors: {
        white: "#ffffff",
        red: "#ff335f",
        blue: "#2e6bff",
        green: "#24f28b",
        purple: "#a155ff",
        yellow: "#ffe74a",
        cyan: "#2bf0ff",
        magenta: "#ff3bd2"
      }
    }
  }
};

export const themePresetOrder: ThemePresetId[] = ["midnight", "blueprint", "slate", "blender", "brutal", "brutalDark"];

export function getThemePreset(id: ThemePresetId): ThemePreset {
  return themePresets[id];
}
