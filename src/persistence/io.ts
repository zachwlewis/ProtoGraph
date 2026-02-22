import type { GraphModel } from "../editor/model/types";

export function downloadGraphJson(graph: GraphModel, filename = "ngsketch-graph.json"): void {
  const blob = new Blob([JSON.stringify(graph, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function parseGraphJsonFile(file: File): Promise<GraphModel> {
  const text = await file.text();
  const parsed = JSON.parse(text) as GraphModel;
  return parsed;
}
