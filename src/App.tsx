import { useEffect, useMemo, useRef } from "react";
import { InfiniteCanvas } from "./editor/canvas/InfiniteCanvas";
import { useGraphStore } from "./editor/store/useGraphStore";

export function App() {
  const didSeedInitialNode = useRef(false);
  const addNodeAt = useGraphStore((state) => state.addNodeAt);
  const addPin = useGraphStore((state) => state.addPin);
  const removePin = useGraphStore((state) => state.removePin);
  const deleteSelection = useGraphStore((state) => state.deleteSelection);
  const duplicateSelection = useGraphStore((state) => state.duplicateSelection);
  const viewport = useGraphStore((state) => state.viewport);
  const nodeCount = useGraphStore((state) => state.order.length);
  const nodes = useGraphStore((state) => state.nodes);
  const pins = useGraphStore((state) => state.pins);
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
        <div className="toolbar-group toolbar-hint">Drag from output pin to input pin to connect</div>
      </header>

      <aside className="left-panel">
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
        <InfiniteCanvas />
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
    </div>
  );
}
