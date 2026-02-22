import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, DragEvent } from "react";
import { InfiniteCanvas } from "./editor/canvas/InfiniteCanvas";
import { createNode, makeGraph, replaceGraphState } from "./editor/model/graphMutations";
import type {
  GraphLibrary,
  GraphModel,
  NavigationMode,
  PinDirection,
  ResolvedNavigationMode,
  SavedGraph,
  ThemePresetId
} from "./editor/model/types";
import { DEFAULT_EXPORT_PREFS } from "./editor/model/types";
import { useGraphStore } from "./editor/store/useGraphStore";
import { getThemePreset, themePresetOrder } from "./editor/theme/themePresets";
import { exportGraphToPng } from "./export/exportPng";
import { downloadGraphJson, parseGraphJsonFile } from "./persistence/io";
import { loadLibraryFromStorage, saveLibraryToStorage } from "./persistence/storage";

type DockSection = "settings" | "properties" | "info";
type NoticeIntent = "info" | "success" | "error";
type NoticeState = { text: string; intent: NoticeIntent };
type DraggedPin = { nodeId: string; direction: PinDirection; index: number; pinId: string } | null;
type PinDropTarget = { direction: PinDirection; index: number } | null;

export function App() {
  const didHydrateInitial = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDetailsElement | null>(null);
  const lastSelectedNodeRef = useRef<GraphModel["nodes"][string] | null>(null);
  const [library, setLibrary] = useState<GraphLibrary | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [inspectorNodeDraft, setInspectorNodeDraft] = useState("");
  const [inspectorPinDrafts, setInspectorPinDrafts] = useState<Record<string, string>>({});
  const [exportMarginDraft, setExportMarginDraft] = useState(String(DEFAULT_EXPORT_PREFS.margin));
  const [exportFrameTitleDraft, setExportFrameTitleDraft] = useState(DEFAULT_EXPORT_PREFS.frameTitle);
  const [graphNameDraft, setGraphNameDraft] = useState("");
  const [dockOpen, setDockOpen] = useState(false);
  const [dockSection, setDockSection] = useState<DockSection>("settings");
  const [graphDeleteConfirm, setGraphDeleteConfirm] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [draggedPin, setDraggedPin] = useState<DraggedPin>(null);
  const [pinDropTarget, setPinDropTarget] = useState<PinDropTarget>(null);

  const addPin = useGraphStore((state) => state.addPin);
  const removePin = useGraphStore((state) => state.removePin);
  const renameNode = useGraphStore((state) => state.renameNode);
  const renamePin = useGraphStore((state) => state.renamePin);
  const reorderPin = useGraphStore((state) => state.reorderPin);
  const replaceGraph = useGraphStore((state) => state.replaceGraph);
  const deleteSelection = useGraphStore((state) => state.deleteSelection);
  const duplicateSelection = useGraphStore((state) => state.duplicateSelection);
  const alignSelection = useGraphStore((state) => state.alignSelection);
  const distributeSelection = useGraphStore((state) => state.distributeSelection);
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

  const activeTheme = useMemo(
    () => getThemePreset(activeSavedGraph?.themePresetId ?? "midnight"),
    [activeSavedGraph?.themePresetId]
  );
  const appThemeStyle = useMemo(() => activeTheme.cssVars as CSSProperties, [activeTheme]);
  const pushNotice = (text: string, intent: NoticeIntent = "info") => setNotice({ text, intent });

  useEffect(() => {
    const previousSelectedNode = lastSelectedNodeRef.current;
    if (previousSelectedNode && (!selectedNode || selectedNode.id !== previousSelectedNode.id)) {
      const nodeDraft = inspectorNodeDraft.trim();
      if (nodeDraft && nodeDraft !== previousSelectedNode.title) {
        renameNode(previousSelectedNode.id, nodeDraft);
      }

      for (const pinId of [...previousSelectedNode.inputPinIds, ...previousSelectedNode.outputPinIds]) {
        const pin = pins[pinId];
        const draft = inspectorPinDrafts[pinId];
        if (!pin || draft === undefined) {
          continue;
        }
        const trimmed = draft.trim();
        if (trimmed && trimmed !== pin.label) {
          renamePin(pinId, trimmed);
        }
      }
    }
    lastSelectedNodeRef.current = selectedNode;
  }, [inspectorNodeDraft, inspectorPinDrafts, pins, renameNode, renamePin, selectedNode]);

  useEffect(() => {
    if (!selectedNode) {
      setInspectorNodeDraft("");
      setInspectorPinDrafts({});
      return;
    }
    setInspectorNodeDraft(selectedNode.title);
    const nextPinDrafts: Record<string, string> = {};
    for (const pinId of [...selectedNode.inputPinIds, ...selectedNode.outputPinIds]) {
      const pin = pins[pinId];
      if (pin) {
        nextPinDrafts[pinId] = pin.label;
      }
    }
    setInspectorPinDrafts(nextPinDrafts);
  }, [pins, selectedNode]);

  useEffect(() => {
    if (!activeSavedGraph) {
      return;
    }
    setExportMarginDraft(String(activeSavedGraph.exportPrefs.margin));
    setExportFrameTitleDraft(activeSavedGraph.exportPrefs.frameTitle);
  }, [activeSavedGraph?.id, activeSavedGraph?.exportPrefs.margin, activeSavedGraph?.exportPrefs.frameTitle]);

  useEffect(() => {
    if (!activeSavedGraph) {
      return;
    }
    setGraphNameDraft(activeSavedGraph.name);
    setGraphDeleteConfirm(false);
  }, [activeSavedGraph?.id]);

  useEffect(() => {
    if (!helpModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHelpModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpModalOpen]);

  useEffect(() => {
    if (!dockOpen) {
      return;
    }

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dockRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      if (activeSavedGraph) {
        renameGraph(activeSavedGraph.id, graphNameDraft);
      }
      setDockOpen(false);
      setGraphDeleteConfirm(false);
    };

    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [activeSavedGraph, dockOpen, graphNameDraft]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (exportMenuRef.current?.contains(target)) {
        return;
      }
      exportMenuRef.current?.removeAttribute("open");
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, []);

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
      pushNotice(loaded ? "Restored graph library from local storage" : "Created initial graph", "success");
    }
  }, [replaceGraph]);

  useEffect(() => {
    if (!library || !activeSavedGraph) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setLibrary((prev) => {
        if (!prev || !prev.graphs[prev.activeGraphId]) {
          return prev;
        }
        const active = prev.graphs[prev.activeGraphId];
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
  }, [activeSavedGraph, graphSnapshot, library]);

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

  const onExportJson = () => {
    const exportName = activeSavedGraph ? toFilenameBase(activeSavedGraph.name) : "ngsketch-graph";
    downloadGraphJson(graphSnapshot, `${exportName}.json`);
    pushNotice("Exported graph JSON", "success");
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
      const parsed = await parseGraphJsonFile(file);
      const imported = replaceGraphState(makeGraph(), parsed.graph);
      const preferredName = (parsed.name ?? file.name.replace(/\.json$/i, "").trim()) || "Imported Graph";
      createGraphFromImport(imported, preferredName);
      pushNotice("Imported graph JSON as a new graph", "success");
    } catch {
      pushNotice("Failed to import JSON", "error");
    }
  };

  const onExportPng = () => {
    const exportName = activeSavedGraph ? toFilenameBase(activeSavedGraph.name) : "ngsketch";
    const prefs = activeSavedGraph?.exportPrefs ?? DEFAULT_EXPORT_PREFS;
    exportGraphToPng(
      graphSnapshot,
      "full",
      {
        width: window.innerWidth - 320,
        height: window.innerHeight - 56
      },
      {
        framed: prefs.includeFrame,
        frameTitle: prefs.frameTitle,
        scale: prefs.scale,
        margin: prefs.margin,
        filenameBase: exportName,
        themePresetId: activeSavedGraph?.themePresetId
      }
    );
    pushNotice(`Exported ${prefs.includeFrame ? "framed" : "full"} PNG`, "success");
  };

  const updateActiveGraphPrefs = (updater: (current: SavedGraph["exportPrefs"]) => SavedGraph["exportPrefs"]) => {
    setLibrary((prev) => {
      if (!prev) {
        return prev;
      }
      const active = prev.graphs[prev.activeGraphId];
      if (!active) {
        return prev;
      }
      return {
        ...prev,
        graphs: {
          ...prev.graphs,
          [active.id]: {
            ...active,
            exportPrefs: updater(active.exportPrefs),
            updatedAt: Date.now()
          }
        }
      };
    });
  };

  const setActiveThemePreset = (presetId: ThemePresetId) => {
    setLibrary((prev) => {
      if (!prev) {
        return prev;
      }
      const active = prev.graphs[prev.activeGraphId];
      if (!active) {
        return prev;
      }
      return {
        ...prev,
        graphs: {
          ...prev.graphs,
          [active.id]: {
            ...active,
            themePresetId: presetId,
            updatedAt: Date.now()
          }
        }
      };
    });
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

    pushNotice("Created new graph", "success");
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

  const commitGraphNameDraft = () => {
    if (!activeSavedGraph) {
      return;
    }
    renameGraph(activeSavedGraph.id, graphNameDraft);
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
    pushNotice("Duplicated graph", "success");
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
    pushNotice("Deleted graph", "success");
  };

  const commitInspectorNodeRename = (nodeId: string, value: string, fallbackTitle: string) => {
    renameNode(nodeId, value);
    setInspectorNodeDraft(() => {
      const trimmed = value.trim();
      return trimmed || fallbackTitle;
    });
  };

  const commitInspectorPinRename = (pinId: string, value: string, fallbackLabel: string) => {
    const pin = pins[pinId];
    if (!pin) {
      return;
    }
    renamePin(pinId, value);
    setInspectorPinDrafts((prev) => {
      const next = { ...prev };
      const trimmed = value.trim();
      next[pinId] = trimmed || fallbackLabel;
      return next;
    });
  };

  const onPinHandleDragStart = (
    nodeId: string,
    direction: PinDirection,
    index: number,
    pinId: string,
    event: DragEvent<HTMLButtonElement>
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", pinId);
    const row = event.currentTarget.closest(".inspector-pin-row");
    if (row) {
      event.dataTransfer.setDragImage(row, 8, row.clientHeight / 2);
    }
    setDraggedPin({ nodeId, direction, index, pinId });
    setPinDropTarget({ direction, index });
  };

  const onPinDragOver = (nodeId: string, direction: PinDirection, targetIndex: number) => {
    if (!draggedPin || draggedPin.direction !== direction || draggedPin.nodeId !== nodeId) {
      return;
    }

    const liveGraph = useGraphStore.getState();
    const node = liveGraph.nodes[nodeId];
    if (!node) {
      return;
    }
    const liveIds = direction === "input" ? node.inputPinIds : node.outputPinIds;
    const liveIndex = liveIds.indexOf(draggedPin.pinId);
    if (liveIndex === -1) {
      return;
    }

    if (liveIndex !== targetIndex) {
      reorderPin(nodeId, direction, liveIndex, targetIndex);
      setDraggedPin({ ...draggedPin, index: targetIndex });
    }
    setPinDropTarget({ direction, index: targetIndex });
  };

  const onPinDrop = (nodeId: string, direction: PinDirection) => {
    if (!draggedPin || draggedPin.direction !== direction || draggedPin.nodeId !== nodeId) {
      return;
    }
    setDraggedPin(null);
    setPinDropTarget(null);
  };

  const openDockSection = (section: DockSection) => {
    if (dockOpen && dockSection === section) {
      setDockOpen(false);
      setGraphDeleteConfirm(false);
      return;
    }
    setDockSection(section);
    setDockOpen(true);
    setGraphDeleteConfirm(false);
  };

  const layoutActions = [
    { kind: "left" as const, icon: "align_horizontal_left", label: "Align left", min: 2 },
    { kind: "center-x" as const, icon: "align_horizontal_center", label: "Align horizontal", min: 2 },
    { kind: "right" as const, icon: "align_horizontal_right", label: "Align right", min: 2 },
    { kind: "top" as const, icon: "vertical_align_top", label: "Align top", min: 2 },
    { kind: "center-y" as const, icon: "vertical_align_center", label: "Align vertical", min: 2 },
    { kind: "bottom" as const, icon: "vertical_align_bottom", label: "Align bottom", min: 2 },
    { kind: "distribute-h" as const, icon: "horizontal_distribute", label: "Distribute horizontal", min: 3 },
    { kind: "distribute-v" as const, icon: "vertical_distribute", label: "Distribute vertical", min: 3 }
  ];

  if (!library || !activeSavedGraph) {
    return null;
  }

  return (
    <div className="app-shell" style={appThemeStyle}>
      <header className="toolbar">
        <div className="toolbar-group toolbar-group-primary">
          <label className="toolbar-select-wrap" title="Select Graph">
            <span className="material-symbols-outlined">folder</span>
            <select
              value={library.activeGraphId}
              onChange={(event) => switchGraph(event.target.value)}
              aria-label="Select graph"
            >
              {library.order.map((graphId) => {
                const graph = library.graphs[graphId];
                if (!graph) {
                  return null;
                }
                return (
                  <option key={graph.id} value={graph.id}>
                    {graph.name}
                  </option>
                );
              })}
            </select>
          </label>

          <button className="icon-button" title="New Graph" aria-label="New Graph" onClick={() => createGraph()}>
            <span className="material-symbols-outlined">note_add</span>
          </button>

          <button className="icon-button" title="Import JSON" aria-label="Import JSON" onClick={onImportJsonClick}>
            <span className="material-symbols-outlined">upload_file</span>
          </button>

          <details className="toolbar-dropdown" ref={exportMenuRef}>
            <summary title="Export options" aria-label="Export options">
              <span className="material-symbols-outlined">download</span>
            </summary>
            <div className="toolbar-menu">
              <button onClick={onExportPng} className="export-primary-btn">
                <span className="material-symbols-outlined">image</span>
                Export PNG
              </button>
              <div className="toolbar-menu-field">
                <span className="toolbar-menu-label">Scale</span>
                <select
                  value={activeSavedGraph.exportPrefs.scale}
                  onChange={(event) =>
                    updateActiveGraphPrefs((prefs) => ({ ...prefs, scale: Number(event.target.value) }))
                  }
                >
                  <option value="1">1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                </select>
              </div>
              <div className="toolbar-menu-field">
                <span className="toolbar-menu-label">Margin (px)</span>
                <input
                  value={exportMarginDraft}
                  onChange={(event) => setExportMarginDraft(event.target.value)}
                  onBlur={() => {
                    const numeric = Number(exportMarginDraft);
                    updateActiveGraphPrefs((prefs) => ({
                      ...prefs,
                      margin: Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : prefs.margin
                    }));
                  }}
                />
              </div>
              <div className="toolbar-menu-field">
                <span className="toolbar-menu-label">Frame Title</span>
                <input
                  value={exportFrameTitleDraft}
                  onChange={(event) => setExportFrameTitleDraft(event.target.value)}
                  onBlur={() =>
                    updateActiveGraphPrefs((prefs) => ({ ...prefs, frameTitle: exportFrameTitleDraft }))
                  }
                />
              </div>
              <label className="toggle-row toolbar-toggle-row">
                <input
                  type="checkbox"
                  checked={activeSavedGraph.exportPrefs.includeFrame}
                  onChange={(event) =>
                    updateActiveGraphPrefs((prefs) => ({ ...prefs, includeFrame: event.target.checked }))
                  }
                />
                Include frame
              </label>
            </div>
          </details>
        </div>

        <div className="toolbar-group">
          <button
            className="icon-button"
            title="Controls and hotkeys"
            aria-label="Controls and hotkeys"
            onClick={() => setHelpModalOpen(true)}
          >
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        className="hidden-file-input"
        type="file"
        accept="application/json"
        onChange={onImportJsonChange}
      />

      <main className="editor-main">
        <InfiniteCanvas
          navigationMode={library.settings.navigationMode}
          resolvedNavigationMode={library.settings.resolvedNavigationMode}
          onResolveNavigationMode={onResolveNavigationMode}
          onConnectError={(message) => pushNotice(message, "error")}
        />
      </main>

      <aside className="right-panel">
        <h3>Layout</h3>
        <div className="layout-grid">
          {layoutActions.map((action) => {
            const enabled = selectedNodeIds.length >= action.min;
            return (
              <button
                key={action.kind}
                className="icon-button layout-icon-btn"
                title={action.label}
                aria-label={action.label}
                disabled={!enabled}
                onClick={() => {
                  if (action.kind === "distribute-h") {
                    distributeSelection("horizontal");
                    return;
                  }
                  if (action.kind === "distribute-v") {
                    distributeSelection("vertical");
                    return;
                  }
                  alignSelection(action.kind);
                }}
              >
                <span className="material-symbols-outlined">{action.icon}</span>
              </button>
            );
          })}
        </div>

        <h3>Node</h3>
        {selectedNode ? (
          <div className="inspector-block" key={selectedNode.id}>
            <input
              value={inspectorNodeDraft}
              onChange={(event) => setInspectorNodeDraft(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              onBlur={(event) =>
                commitInspectorNodeRename(selectedNode.id, event.currentTarget.value, selectedNode.title)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitInspectorNodeRename(selectedNode.id, event.currentTarget.value, selectedNode.title);
                  event.currentTarget.blur();
                } else if (event.key === "Escape") {
                  setInspectorNodeDraft(selectedNode.title);
                  event.currentTarget.blur();
                }
              }}
            />

            <section className="pin-group">
              <header>Inputs</header>
              <div className="pin-list grouped-pin-list">
                {selectedNode.inputPinIds.map((pinId, index) => {
                  const pin = pins[pinId];
                  if (!pin) {
                    return null;
                  }
                  return (
                    <div
                      className={`inspector-pin-row pin-row-grouped ${
                        draggedPin?.pinId === pinId ? "is-dragging" : ""
                      } ${
                        pinDropTarget?.direction === "input" && pinDropTarget.index === index ? "is-drop-target" : ""
                      }`}
                      key={pin.id}
                      onDragOver={(event) => {
                        event.preventDefault();
                        onPinDragOver(selectedNode.id, "input", index);
                      }}
                      onDragEnter={() => {
                        onPinDragOver(selectedNode.id, "input", index);
                      }}
                      onDrop={() => onPinDrop(selectedNode.id, "input")}
                    >
                      <button
                        className="pin-handle"
                        title="Reorder input"
                        aria-label="Reorder input"
                        draggable
                        onDragStart={(event) =>
                          onPinHandleDragStart(selectedNode.id, "input", index, pin.id, event)
                        }
                        onDragEnd={() => {
                          setDraggedPin(null);
                          setPinDropTarget(null);
                        }}
                      >
                        <span className="material-symbols-outlined">drag_indicator</span>
                      </button>
                      <input
                        className="pin-edit-input"
                        value={inspectorPinDrafts[pin.id] ?? pin.label}
                        onChange={(event) =>
                          setInspectorPinDrafts((prev) => ({ ...prev, [pin.id]: event.target.value }))
                        }
                        onFocus={(event) => event.currentTarget.select()}
                        onBlur={(event) =>
                          commitInspectorPinRename(pin.id, event.currentTarget.value, pin.label)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitInspectorPinRename(pin.id, event.currentTarget.value, pin.label);
                            event.currentTarget.blur();
                          } else if (event.key === "Escape") {
                            setInspectorPinDrafts((prev) => ({ ...prev, [pin.id]: pin.label }));
                            event.currentTarget.blur();
                          }
                        }}
                      />
                      <button
                        className="pin-delete-btn"
                        onClick={() => removePin(pin.id)}
                        title="Remove input"
                        aria-label="Remove input"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  );
                })}
                <button className="pin-add-btn" onClick={() => addPin(selectedNode.id, "input")}>Add Input</button>
              </div>
            </section>

            <section className="pin-group">
              <header>Outputs</header>
              <div className="pin-list grouped-pin-list">
                {selectedNode.outputPinIds.map((pinId, index) => {
                  const pin = pins[pinId];
                  if (!pin) {
                    return null;
                  }
                  return (
                    <div
                      className={`inspector-pin-row pin-row-grouped ${
                        draggedPin?.pinId === pinId ? "is-dragging" : ""
                      } ${
                        pinDropTarget?.direction === "output" && pinDropTarget.index === index ? "is-drop-target" : ""
                      }`}
                      key={pin.id}
                      onDragOver={(event) => {
                        event.preventDefault();
                        onPinDragOver(selectedNode.id, "output", index);
                      }}
                      onDragEnter={() => {
                        onPinDragOver(selectedNode.id, "output", index);
                      }}
                      onDrop={() => onPinDrop(selectedNode.id, "output")}
                    >
                      <button
                        className="pin-handle"
                        title="Reorder output"
                        aria-label="Reorder output"
                        draggable
                        onDragStart={(event) =>
                          onPinHandleDragStart(selectedNode.id, "output", index, pin.id, event)
                        }
                        onDragEnd={() => {
                          setDraggedPin(null);
                          setPinDropTarget(null);
                        }}
                      >
                        <span className="material-symbols-outlined">drag_indicator</span>
                      </button>
                      <input
                        className="pin-edit-input"
                        value={inspectorPinDrafts[pin.id] ?? pin.label}
                        onChange={(event) =>
                          setInspectorPinDrafts((prev) => ({ ...prev, [pin.id]: event.target.value }))
                        }
                        onFocus={(event) => event.currentTarget.select()}
                        onBlur={(event) =>
                          commitInspectorPinRename(pin.id, event.currentTarget.value, pin.label)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitInspectorPinRename(pin.id, event.currentTarget.value, pin.label);
                            event.currentTarget.blur();
                          } else if (event.key === "Escape") {
                            setInspectorPinDrafts((prev) => ({ ...prev, [pin.id]: pin.label }));
                            event.currentTarget.blur();
                          }
                        }}
                      />
                      <button
                        className="pin-delete-btn"
                        onClick={() => removePin(pin.id)}
                        title="Remove output"
                        aria-label="Remove output"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  );
                })}
                <button className="pin-add-btn" onClick={() => addPin(selectedNode.id, "output")}>Add Output</button>
              </div>
            </section>
          </div>
        ) : (
          <p>Select one node to edit pins.</p>
        )}
      </aside>

      <div className="floating-dock" role="toolbar" aria-label="Graph quick controls" ref={dockRef}>
        <button
          className={`dock-icon-btn ${dockOpen && dockSection === "settings" ? "is-active" : ""}`}
          onClick={() => openDockSection("settings")}
          title="Settings"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button
          className={`dock-icon-btn ${dockOpen && dockSection === "properties" ? "is-active" : ""}`}
          onClick={() => openDockSection("properties")}
          title="Graph Properties"
          aria-label="Graph Properties"
        >
          <span className="material-symbols-outlined">tune</span>
        </button>
        <button
          className={`dock-icon-btn ${dockOpen && dockSection === "info" ? "is-active" : ""}`}
          onClick={() => openDockSection("info")}
          title="Graph Info"
          aria-label="Graph Info"
        >
          <span className="material-symbols-outlined">info</span>
        </button>
      </div>

      {dockOpen ? (
        <div className="floating-panel" ref={panelRef}>
          <div className="floating-panel-header">
            <strong>
              {dockSection === "settings"
                ? "Settings"
                : dockSection === "properties"
                  ? "Graph Properties"
                  : "Graph Info"}
            </strong>
          </div>

          {dockSection === "settings" ? (
            <div className="floating-panel-content">
              <span className="panel-label">Navigation Mode</span>
              <div className="icon-toggle">
                <button
                  className={`icon-toggle-btn ${
                    library.settings.navigationMode === "mouse" ? "is-active" : ""
                  }`}
                  onClick={() => setNavigationMode("mouse")}
                  title="Mouse mode"
                  aria-label="Mouse mode"
                >
                  <span className="material-symbols-outlined">mouse</span>
                </button>
                <button
                  className={`icon-toggle-btn ${
                    library.settings.navigationMode === "trackpad" ? "is-active" : ""
                  }`}
                  onClick={() => setNavigationMode("trackpad")}
                  title="Trackpad mode"
                  aria-label="Trackpad mode"
                >
                  <span className="material-symbols-outlined">touchpad_mouse</span>
                </button>
              </div>
            </div>
          ) : null}

          {dockSection === "properties" ? (
            <div className="floating-panel-content">
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
              <label>
                Theme Preset
                <select
                  value={activeSavedGraph.themePresetId}
                  onChange={(event) => setActiveThemePreset(event.target.value as ThemePresetId)}
                >
                  {themePresetOrder.map((presetId) => (
                    <option key={presetId} value={presetId}>
                      {getThemePreset(presetId).label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {dockSection === "info" ? (
            <div className="floating-panel-content">
              <label>
                Graph Name
                <input
                  value={graphNameDraft}
                  onChange={(event) => setGraphNameDraft(event.target.value)}
                  onBlur={commitGraphNameDraft}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      commitGraphNameDraft();
                      event.currentTarget.blur();
                    }
                  }}
                />
              </label>
              <div className="floating-actions-row">
                <button onClick={() => duplicateGraph(activeSavedGraph.id)}>
                  <span className="material-symbols-outlined">content_copy</span>
                  Duplicate
                </button>
                <button onClick={onExportJson}>
                  <span className="material-symbols-outlined">download</span>
                  Export JSON
                </button>
              </div>

              {!graphDeleteConfirm ? (
                <button className="danger" onClick={() => setGraphDeleteConfirm(true)}>
                  <span className="material-symbols-outlined">delete</span>
                  Delete Graph
                </button>
              ) : (
                <div className="inline-confirm">
                  <span>Delete this graph?</span>
                  <div className="floating-actions-row">
                    <button
                      className="danger"
                      onClick={() => {
                        deleteGraph(activeSavedGraph.id);
                        setGraphDeleteConfirm(false);
                      }}
                    >
                      Confirm
                    </button>
                    <button onClick={() => setGraphDeleteConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {helpModalOpen ? (
        <div className="modal-overlay" onMouseDown={() => setHelpModalOpen(false)}>
          <div className="help-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="help-modal-header">
              <h3>Controls and Hotkeys</h3>
              <button className="icon-button" onClick={() => setHelpModalOpen(false)} aria-label="Close help" title="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="help-modal-body">
              <h4>Navigation</h4>
              <ul>
                <li>Mouse mode: Wheel to zoom, right-click drag to pan.</li>
                <li>Trackpad mode: Two-finger scroll to pan, pinch to zoom.</li>
                <li>Space + left-drag: pan fallback.</li>
              </ul>

              <h4>Editing</h4>
              <ul>
                <li>Double-click node title or pin label to edit inline.</li>
                <li>Drag from output pin to input pin to create a wire.</li>
                <li>Drag empty canvas to marquee-select nodes.</li>
                <li>Shift + click node toggles node in selection.</li>
              </ul>

              <h4>Keyboard</h4>
              <ul>
                <li><kbd>Delete</kbd>/<kbd>Backspace</kbd>: delete current selection.</li>
                <li><kbd>Cmd/Ctrl + D</kbd>: duplicate selected node(s).</li>
                <li><kbd>Enter</kbd>: commit active input edit.</li>
                <li><kbd>Escape</kbd>: cancel active input edit or close help modal.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className={`app-notice is-${notice.intent}`}>
          <span className="material-symbols-outlined">{iconForNotice(notice.intent)}</span>
          <span>{notice.text}</span>
        </div>
      ) : null}
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
  pickMostRecentlyUpdatedGraphId,
  toFilenameBase
};

function toFilenameBase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "ngsketch-graph";
  }
  const safe = trimmed
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return safe || "ngsketch-graph";
}

function iconForNotice(intent: NoticeIntent): string {
  if (intent === "success") {
    return "check_circle";
  }
  if (intent === "error") {
    return "error";
  }
  return "info";
}
