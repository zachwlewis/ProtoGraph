export const layoutTokens = {
  node: {
    width: 260,
    titleHeight: 38,
    bodyBottomPadding: 14,
    borderRadius: 10
  },
  pin: {
    rowHeight: 22,
    topPadding: 12,
    radius: 5,
    anchorInset: 0,
    labelGap: 7
  },
  text: {
    titleSize: 16,
    pinSize: 12,
    titleWeight: 600,
    pinWeight: 400,
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  colors: {
    nodeFill: "#1f2530",
    nodeStroke: "#3c495e",
    title: "#c8d9ff",
    pinLabel: "#bbcae5",
    divider: "#303a4a"
  }
} as const;
