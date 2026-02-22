import type { GraphModel } from "../editor/model/types";

export function downloadGraphJson(graph: GraphModel, filename = "ProtoGraph-graph.json"): void {
  const blob = new Blob([JSON.stringify(graph, null, 2)], { type: "application/json" });
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
};

export async function parseGraphJsonFile(file: File): Promise<ParsedGraphJson> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;

  if (isNamedGraphPayload(parsed)) {
    return {
      graph: parsed.graph,
      name: parsed.name.trim() || null
    };
  }

  return {
    graph: parsed as GraphModel,
    name: null
  };
}

function isNamedGraphPayload(value: unknown): value is { graph: GraphModel; name: string } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as { graph?: unknown; name?: unknown };
  return typeof candidate.name === "string" && Boolean(candidate.graph);
}
