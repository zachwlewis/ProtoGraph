import type { GraphModel, NavigationMode, ResolvedNavigationMode } from "../editor/model/types";

const GRAPH_STORAGE_KEY = "ngsketch.graph.v1";
const NAV_SETTINGS_KEY = "ngsketch.nav-settings.v1";

type NavigationSettings = {
  navigationMode: NavigationMode;
  resolvedNavigationMode: ResolvedNavigationMode;
};

export function saveGraphToStorage(graph: GraphModel): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graph));
}

export function loadGraphFromStorage(): GraphModel | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(GRAPH_STORAGE_KEY);
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
  window.localStorage.removeItem(GRAPH_STORAGE_KEY);
}

export function saveNavigationSettings(settings: NavigationSettings): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(NAV_SETTINGS_KEY, JSON.stringify(settings));
}

export function loadNavigationSettings(): NavigationSettings | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(NAV_SETTINGS_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as NavigationSettings;
    if (!parsed?.navigationMode || parsed.navigationMode === "auto") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
