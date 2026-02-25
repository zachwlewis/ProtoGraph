import type { ExportPrefs, GraphModel, ThemePresetId } from "../editor/model/types";

export type GraphJsonPayload = {
  graph: GraphModel;
  name?: string;
  themePresetId?: ThemePresetId;
  exportPrefs?: ExportPrefs;
};

export function downloadGraphJson(payload: GraphJsonPayload, filename = "ProtoGraph-graph.json"): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type ParsedGraphJson = {
  graph: GraphModel;
  name: string | null;
  themePresetId: ThemePresetId | null;
  exportPrefs: ExportPrefs | null;
};

export async function parseGraphJsonFile(file: File): Promise<ParsedGraphJson> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;

  if (isGraphPayload(parsed)) {
    return {
      graph: parsed.graph,
      name: typeof parsed.name === "string" ? parsed.name.trim() || null : null,
      themePresetId: parseThemePresetId(parsed.themePresetId),
      exportPrefs: parseExportPrefs(parsed.exportPrefs)
    };
  }

  return {
    graph: parsed as GraphModel,
    name: null,
    themePresetId: null,
    exportPrefs: null
  };
}

function isGraphPayload(value: unknown): value is {
  graph: GraphModel;
  name?: unknown;
  themePresetId?: unknown;
  exportPrefs?: unknown;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as { graph?: unknown };
  return Boolean(candidate.graph);
}

function parseThemePresetId(value: unknown): ThemePresetId | null {
  if (value === "midnight" || value === "blueprint" || value === "slate" || value === "blender") {
    return value;
  }
  return null;
}

function parseExportPrefs(value: unknown): ExportPrefs | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Partial<ExportPrefs>;
  const rawScale = Number(candidate.scale);
  const rawMargin = Number(candidate.margin);

  const scale = Number.isFinite(rawScale) && rawScale > 0 ? rawScale : 2;
  const margin = Number.isFinite(rawMargin) ? Math.max(0, Math.round(rawMargin)) : 60;
  const includeFrame = typeof candidate.includeFrame === "boolean" ? candidate.includeFrame : false;
  const frameTitle = typeof candidate.frameTitle === "string" ? candidate.frameTitle : "ProtoGraph mockup";

  return {
    scale,
    margin,
    includeFrame,
    frameTitle
  };
}
