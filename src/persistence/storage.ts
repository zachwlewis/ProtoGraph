import type { GraphLibrary } from "../editor/model/types";

const LIBRARY_STORAGE_KEY = "protograph.library.v2";

export function saveLibraryToStorage(library: GraphLibrary): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
}

export function loadLibraryFromStorage(): GraphLibrary | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as GraphLibrary;
    const hasValidActiveGraph =
      parsed?.activeGraphId === null ||
      (typeof parsed?.activeGraphId === "string" && Boolean(parsed.graphs?.[parsed.activeGraphId]));
    if (
      parsed?.version !== 2 ||
      !parsed.graphs ||
      !Array.isArray(parsed.order) ||
      !parsed.settings ||
      !hasValidActiveGraph
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredLibrary(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(LIBRARY_STORAGE_KEY);
}
