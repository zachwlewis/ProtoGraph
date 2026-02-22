import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { InfiniteCanvas } from "./editor/canvas/InfiniteCanvas";
import { createNode, makeGraph, replaceGraphState } from "./editor/model/graphMutations";
import type {
  GraphLibrary,
  GraphModel,
  NavigationMode,
  ResolvedNavigationMode,
  SavedGraph
} from "./editor/model/types";
import { DEFAULT_EXPORT_PREFS } from "./editor/model/types";
import { useGraphStore } from "./editor/store/useGraphStore";
import { exportGraphToPng } from "./export/exportPng";
import { downloadGraphJson, parseGraphJsonFile } from "./persistence/io";
import { loadLibraryFromStorage, saveLibraryToStorage } from "./persistence/storage";

export function App() {
  const didHydrateInitial = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [library, setLibrary] = useState<GraphLibrary | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingGraphId, setEditingGraphId] = useState<string | null>(null);
  const [editingGraphName, setEditingGraphName] = useState("");

  const addNodeAt = useGraphStore((state) => state.addNodeAt);
  const addPin = useGraphStore((state) => state.addPin);
  const removePin = useGraphStore((state) => state.removePin);
  const replaceGraph = useGraphStore((state) => state.replaceGraph);
  const deleteSelection = useGraphStore((state) => state.deleteSelection);
  const duplicateSelection = useGraphStore((state) => state.duplicateSelection);
  const viewport = useGraphStore((state) => state.viewport);
  const order = useGraphStore((state) => state.order);
  const edgeOrder = useGraphStore((state) => state.edgeOrder);
  const nodes = useGraphStore((state) => state.nodes);
  const pins = useGraphStore((state) => state.pins);
  const edges = useGraphStore((state) => state.edges);
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const singleInputPolicy = useGraphStore((state) => state.singleInputPolicy);
  const setSingleInputPolicy = useGraphStore((state) => state.setSingleInputPolicy);
  const allowSameNodeConnections = useGraphStore((state) => state.allowSameNodeConnections);
  const setAllowSameNodeConnections = useGraphStore((state) => state.setAllowSameNodeConnections);

  const selectedNode = useMemo(() => {
    if (selectedNodeIds.length !== 1) {
      return null;
    }
    return nodes[selectedNodeIds[0]] ?? null;
  }, [nodes, selectedNodeIds]);

  const graphSnapshot = useMemo(
    () => ({
      nodes,
      pins,
      edges,
      order,
      edgeOrder,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      viewport,
      singleInputPolicy,
      allowSameNodeConnections
    }),
    [allowSameNodeConnections, edgeOrder, edges, nodes, order, pins, singleInputPolicy, viewport]
  );

  const activeSavedGraph = useMemo(() => {
    if (!library) {
      return null;
    }
    return library.graphs[library.activeGraphId] ?? null;
  }, [library]);
  const activeGraphId = library?.activeGraphId ?? null;

  useEffect(() => {
    if (didHydrateInitial.current) {
      return;
    }
    didHydrateInitial.current = true;

    const loaded = loadLibraryFromStorage();
    const initial = loaded ?? createInitialLibrary();
    setLibrary(initial);

    const active = initial.graphs[initial.activeGraphId];
    if (active) {
      replaceGraph(active.graph);
      setNotice(loaded ? "Restored graph library from local storage" : "Created initial graph");
    }
  }, [replaceGraph]);

  useEffect(() => {
    if (!library || !activeGraphId) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setLibrary((prev) => {
        if (!prev || !prev.graphs[activeGraphId]) {
          return prev;
        }
        const active = prev.graphs[activeGraphId];
        return {
          ...prev,
          graphs: {
            ...prev.graphs,
            [active.id]: {
              ...active,
              graph: graphSnapshot,
              updatedAt: Date.now()
            }
          }
        };
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [activeGraphId, graphSnapshot]);

  useEffect(() => {
    if (!library) {
      return;
    }
    saveLibraryToStorage(library);
  }, [library]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelection();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelection();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelection, duplicateSelection]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timeout = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const addNodeAtCenter = () => {
    const worldX = (window.innerWidth * 0.5 - viewport.x) / viewport.zoom;
    const worldY = (window.innerHeight * 0.5 - viewport.y) / viewport.zoom;
    addNodeAt(worldX - 120, worldY - 30, "Node");
  };

  const onExportJson = () => {
    downloadGraphJson(graphSnapshot);
    setNotice("Exported graph JSON");
  };

  const onImportJsonClick = () => {
    fileInputRef.current?.click();
  };

  const onImportJsonChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    try {
      const imported = replaceGraphState(makeGraph(), await parseGraphJsonFile(file));
      createGraphFromImport(imported, file.name.replace(/\.json$/i, "") || "Imported Graph");
      setNotice("Imported graph JSON as a new graph");
    } catch {
      setNotice("Failed to import JSON");
    }
  };

  const onExportPngViewport = () => {
    exportGraphToPng(graphSnapshot, "viewport", {
      width: window.innerWidth - 520,
      height: window.innerHeight - 56
    });
    setNotice("Exported viewport PNG");
  };

  const onExportPngFull = () => {
    exportGraphToPng(graphSnapshot, "full", {
      width: window.innerWidth - 520,
      height: window.innerHeight - 56
    });
    setNotice("Exported full graph PNG");
  };

  const onExportPngFramed = () => {
    exportGraphToPng(
      graphSnapshot,
      "full",
      {
        width: window.innerWidth - 520,
        height: window.innerHeight - 56
      },
      { framed: true, frameTitle: "ngsketch mockup" }
    );
    setNotice("Exported framed PNG");
  };

  const setNavigationMode = (mode: Exclude<NavigationMode, "auto">) => {
    setLibrary((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          navigationMode: mode,
          resolvedNavigationMode: mode
        }
      };
    });
  };

  const onResolveNavigationMode = (mode: Exclude<ResolvedNavigationMode, null>) => {
    setLibrary((prev) => {
      if (!prev) {
        return prev;
      }
      if (prev.settings.navigationMode !== "auto") {
        return prev;
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          navigationMode: mode,
          resolvedNavigationMode: mode
        }
      };
    });
  };

  const switchGraph = (graphId: string) => {
    setLibrary((prev) => {
      if (!prev || !prev.graphs[graphId]) {
        return prev;
      }
        const current = prev.graphs[prev.activeGraphId];
      const nextGraphs = {
        ...prev.graphs,
        [current.id]: {
          ...current,
          graph: graphSnapshot,
          updatedAt: Date.now()
        }
      };
      const target = nextGraphs[graphId];
      replaceGraph(target.graph);
      return {
        ...prev,
        activeGraphId: graphId,
        graphs: nextGraphs
      };
    });
  };

  const createGraph = (name?: string) => {
    const next = seedGraph();
    const graphId = createGraphId();

    setLibrary((prev) => {
      if (!prev) {
        return prev;
      }

      const current = prev.graphs[prev.activeGraphId];
      const nextName = name ?? nextUntitledName(prev);
      const nextGraphs = {
        ...prev.graphs,
        [current.id]: {
          ...current,
          graph: graphSnapshot,
          updatedAt: Date.now()
        },
        [graphId]: {
          id: graphId,
          name: nextName,
          updatedAt: Date.now(),
          graph: next,
          exportPrefs: { ...DEFAULT_EXPORT_PREFS },
          themePresetId: "midnight" as const
        }
      };

      replaceGraph(next);
      return {
        ...prev,
        activeGraphId: graphId,
        graphs: nextGraphs,
        order: [...prev.order, graphId]
      };
    });

    setNotice("Created new graph");
  };

  const createGraphFromImport = (graph: GraphModel, preferredName: string) => {
    const graphId = createGraphId();
    setLibrary((prev) => {
      if (!prev) {
        return prev;
      }
      const current = prev.graphs[prev.activeGraphId];
      const nextGraphs = {
        ...prev.graphs,
        [current.id]: {
          ...current,
          graph: graphSnapshot,
          updatedAt: Date.now()
        },
        [graphId]: {
          id: graphId,
          name: preferredName,
          updatedAt: Date.now(),
          graph,
          exportPrefs: { ...DEFAULT_EXPORT_PREFS },
          themePresetId: "midnight" as const
        }
      };
      replaceGraph(graph);
      return {
        ...prev,
        activeGraphId: graphId,
        graphs: nextGraphs,
        order: [...prev.order, graphId]
      };
    });
  };

  const renameGraph = (graphId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setLibrary((prev) => {
      if (!prev || !prev.graphs[graphId]) {
        return prev;
      }
      return {
        ...prev,
        graphs: {
          ...prev.graphs,
          [graphId]: {
            ...prev.graphs[graphId],
            name: trimmed,
            updatedAt: Date.now()
          }
        }
      };
    });
  };

  const duplicateGraph = (graphId: string) => {
    setLibrary((prev) => {
      if (!prev || !prev.graphs[graphId]) {
        return prev;
      }
      const source = prev.graphs[graphId];
      const duplicateId = createGraphId();
      const duplicateName = `${source.name} Copy`;
      return {
        ...prev,
        graphs: {
          ...prev.graphs,
          [duplicateId]: {
            ...source,
            id: duplicateId,
            name: duplicateName,
            updatedAt: Date.now(),
            graph: replaceGraphState(makeGraph(), source.graph)
          }
        },
        order: [...prev.order, duplicateId]
      };
    });
    setNotice("Duplicated graph");
  };

  const deleteGraph = (graphId: string) => {
    setLibrary((prev) => {
      if (!prev || !prev.graphs[graphId]) {
        return prev;
      }

      const nextOrder = prev.order.filter((id) => id !== graphId);
      const nextGraphs = { ...prev.graphs };
      delete nextGraphs[graphId];

      if (nextOrder.length === 0) {
        const seeded = seedGraph();
        const seededId = createGraphId();
        replaceGraph(seeded);
        return {
          ...prev,
          activeGraphId: seededId,
          order: [seededId],
          graphs: {
            [seededId]: {
              id: seededId,
              name: "Untitled 1",
              updatedAt: Date.now(),
              graph: seeded,
              exportPrefs: { ...DEFAULT_EXPORT_PREFS },
              themePresetId: "midnight" as const
            }
          }
        };
      }

      let nextActive = prev.activeGraphId;
      if (graphId === prev.activeGraphId) {
        nextActive = pickMostRecentlyUpdatedGraphId(nextOrder, nextGraphs) ?? nextOrder[0];
        replaceGraph(nextGraphs[nextActive].graph);
      }

      return {
        ...prev,
        activeGraphId: nextActive,
        order: nextOrder,
        graphs: nextGraphs
      };
    });
    setNotice("Deleted graph");
  };

  const startGraphRename = (graphId: string) => {
    const graph = library?.graphs[graphId];
    if (!graph) {
      return;
    }
    setEditingGraphId(graphId);
    setEditingGraphName(graph.name);
  };

  const commitGraphRename = (graphId: string) => {
    renameGraph(graphId, editingGraphName);
    setEditingGraphId(null);
    setEditingGraphName("");
  };

  if (!library || !activeSavedGraph) {
    return null;
  }

  return (
    <div className="app-shell">
      <header className="toolbar">
        <div className="toolbar-group">
          <button onClick={addNodeAtCenter}>Add Node</button>
          <details className="toolbar-dropdown">
            <summary>Export</summary>
            <div className="toolbar-menu">
              <button onClick={onExportPngViewport}>PNG Viewport</button>
              <button onClick={onExportPngFull}>PNG Full</button>
              <button onClick={onExportPngFramed}>PNG Framed</button>
              <button onClick={onExportJson}>Download JSON</button>
              <button onClick={onImportJsonClick}>Load JSON</button>
            </div>
          </details>
        </div>
        <div className="toolbar-group toolbar-hint">Drag from output pin to input pin to connect</div>
      </header>

      <input
        ref={fileInputRef}
        className="hidden-file-input"
        type="file"
        accept="application/json"
        onChange={onImportJsonChange}
      />

      <aside className="left-panel">
        <h3>Graphs</h3>
        <div className="graph-actions">
          <button onClick={() => createGraph()}>New Graph</button>
        </div>
        <div className="graph-list">
          {library.order.map((graphId) => {
            const graph = library.graphs[graphId];
            if (!graph) {
              return null;
            }
            return (
              <div key={graph.id} className={`graph-item ${graph.id === library.activeGraphId ? "is-active" : ""}`}>
                {editingGraphId === graph.id ? (
                  <input
                    className="graph-rename-input"
                    autoFocus
                    value={editingGraphName}
                    onChange={(event) => setEditingGraphName(event.target.value)}
                    onBlur={() => commitGraphRename(graph.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        commitGraphRename(graph.id);
                      } else if (event.key === "Escape") {
                        setEditingGraphId(null);
                        setEditingGraphName("");
                      }
                    }}
                  />
                ) : (
                  <button className="graph-open" onClick={() => switchGraph(graph.id)}>
                    {graph.name}
                  </button>
                )}
                <div className="graph-item-actions">
                  <button onClick={() => startGraphRename(graph.id)}>
                    Rename
                  </button>
                  <button onClick={() => duplicateGraph(graph.id)}>Duplicate</button>
                  <button onClick={() => deleteGraph(graph.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>

        <h3>Navigation</h3>
        <label>
          Mode
          <select
            value={library.settings.navigationMode === "auto" ? "" : library.settings.navigationMode}
            onChange={(event) => setNavigationMode(event.target.value as Exclude<NavigationMode, "auto">)}
          >
            <option value="" disabled>
              Detecting from input...
            </option>
            <option value="mouse">Mouse</option>
            <option value="trackpad">Trackpad</option>
          </select>
        </label>
        <p className="nav-mode-hint">Active: {library.settings.navigationMode === "auto" ? "detecting" : library.settings.navigationMode}</p>

        <h3>Graph Rules</h3>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={singleInputPolicy}
            onChange={(event) => setSingleInputPolicy(event.target.checked)}
          />
          Single input connection policy
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={allowSameNodeConnections}
            onChange={(event) => setAllowSameNodeConnections(event.target.checked)}
          />
          Allow same-node connections
        </label>
      </aside>

      <main className="editor-main">
        <InfiniteCanvas
          navigationMode={library.settings.navigationMode}
          resolvedNavigationMode={library.settings.resolvedNavigationMode}
          onResolveNavigationMode={onResolveNavigationMode}
        />
      </main>

      <aside className="right-panel">
        <h3>Inspector</h3>
        {selectedNode ? (
          <div className="inspector-block">
            <div className="inspector-title">{selectedNode.title}</div>

            <div className="inspector-actions">
              <button onClick={() => addPin(selectedNode.id, "input")}>Add Input Pin</button>
              <button onClick={() => addPin(selectedNode.id, "output")}>Add Output Pin</button>
            </div>

            <div className="pin-list">
              {[...selectedNode.inputPinIds, ...selectedNode.outputPinIds].map((pinId) => {
                const pin = pins[pinId];
                if (!pin) {
                  return null;
                }
                return (
                  <div className="inspector-pin-row" key={pin.id}>
                    <span>{pin.direction === "input" ? "In" : "Out"}: {pin.label}</span>
                    <button onClick={() => removePin(pin.id)}>Remove</button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p>Select one node to edit pins.</p>
        )}
      </aside>

      {notice ? <div className="app-notice">{notice}</div> : null}
    </div>
  );
}

function createGraphId(): string {
  return `graph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedGraph(): GraphModel {
  const [seeded] = createNode(makeGraph(), { x: 120, y: 120, title: "Example Node" });
  return seeded;
}

function nextUntitledName(library: GraphLibrary): string {
  const existing = new Set(Object.values(library.graphs).map((graph) => graph.name));
  let value = 1;
  while (existing.has(`Untitled ${value}`)) {
    value += 1;
  }
  return `Untitled ${value}`;
}

function createInitialLibrary(): GraphLibrary {
  const firstId = createGraphId();
  return {
    version: 2,
    activeGraphId: firstId,
    order: [firstId],
    graphs: {
      [firstId]: {
        id: firstId,
        name: "Untitled 1",
        updatedAt: Date.now(),
        graph: seedGraph(),
        exportPrefs: { ...DEFAULT_EXPORT_PREFS },
        themePresetId: "midnight" as const
      }
    },
    settings: {
      navigationMode: "auto",
      resolvedNavigationMode: null
    }
  };
}

function pickMostRecentlyUpdatedGraphId(
  ids: string[],
  graphs: Record<string, SavedGraph>
): string | null {
  if (ids.length === 0) {
    return null;
  }
  let bestId = ids[0];
  let bestUpdatedAt = graphs[bestId]?.updatedAt ?? Number.NEGATIVE_INFINITY;
  for (const id of ids) {
    const updatedAt = graphs[id]?.updatedAt ?? Number.NEGATIVE_INFINITY;
    if (updatedAt > bestUpdatedAt) {
      bestId = id;
      bestUpdatedAt = updatedAt;
    }
  }
  return bestId;
}

export const __testables = {
  pickMostRecentlyUpdatedGraphId
};
