import type { GraphModel } from "../editor/model/types";

const STORAGE_KEY = "ngsketch.graph.v1";

export function saveGraphToStorage(graph: GraphModel): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
}

export function loadGraphFromStorage(): GraphModel | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GraphModel;
  } catch {
    return null;
  }
}

export function clearStoredGraph(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}
