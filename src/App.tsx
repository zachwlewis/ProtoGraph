import { useEffect, useRef } from "react";
import { InfiniteCanvas } from "./editor/canvas/InfiniteCanvas";
import { useGraphStore } from "./editor/store/useGraphStore";

export function App() {
  const didSeedInitialNode = useRef(false);
  const addNodeAt = useGraphStore((state) => state.addNodeAt);
  const deleteSelection = useGraphStore((state) => state.deleteSelection);
  const duplicateSelection = useGraphStore((state) => state.duplicateSelection);
  const viewport = useGraphStore((state) => state.viewport);
  const nodeCount = useGraphStore((state) => state.order.length);

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
    if (didSeedInitialNode.current) {
      return;
    }
    didSeedInitialNode.current = true;

    if (nodeCount > 0) {
      return;
    }
    addNodeAt(120, 120, "Example Node");
  }, [addNodeAt, nodeCount]);

  const addNodeAtCenter = () => {
    const worldX = (window.innerWidth * 0.5 - viewport.x) / viewport.zoom;
    const worldY = (window.innerHeight * 0.5 - viewport.y) / viewport.zoom;
    addNodeAt(worldX - 120, worldY - 30, "Node");
  };

  return (
    <div className="app-shell">
      <header className="toolbar">
        <div className="toolbar-group">
          <button onClick={addNodeAtCenter}>Add Node</button>
        </div>
        <div className="toolbar-group toolbar-hint">Double-click canvas to add node</div>
      </header>
      <aside className="left-panel">Palette (PR2+)</aside>
      <main className="editor-main">
        <InfiniteCanvas />
      </main>
      <aside className="right-panel">Inspector (PR2+)</aside>
    </div>
  );
}
