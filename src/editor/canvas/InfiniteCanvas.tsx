import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from "react";
import { GridBackground } from "./GridBackground";
import { useGraphStore } from "../store/useGraphStore";
import { NodeCard } from "../components/NodeCard";
import { screenToWorld } from "../utils/geometry";
import type { NodeModel } from "../model/types";

type DragState =
  | { mode: "idle" }
  | { mode: "panning"; lastClientX: number; lastClientY: number }
  | { mode: "node-drag"; lastClientX: number; lastClientY: number };

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState>({ mode: "idle" });
  const [spaceHeld, setSpaceHeld] = useState(false);

  const order = useGraphStore((state) => state.order);
  const nodesById = useGraphStore((state) => state.nodes);
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const viewport = useGraphStore((state) => state.viewport);
  const addNodeAt = useGraphStore((state) => state.addNodeAt);
  const setSelection = useGraphStore((state) => state.setSelection);
  const clearSelection = useGraphStore((state) => state.clearSelection);
  const panBy = useGraphStore((state) => state.panBy);
  const zoomAt = useGraphStore((state) => state.zoomAt);
  const moveSelectionBy = useGraphStore((state) => state.moveSelectionBy);

  const nodes = useMemo(
    () => order.map((id) => nodesById[id]).filter((node): node is NodeModel => node !== undefined),
    [order, nodesById]
  );
  const selectedNodeIdsSet = useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        setSpaceHeld(true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setSpaceHeld(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (dragState.mode === "idle") {
        return;
      }

      const dxScreen = event.clientX - dragState.lastClientX;
      const dyScreen = event.clientY - dragState.lastClientY;

      if (dragState.mode === "panning") {
        panBy(dxScreen, dyScreen);
      }

      if (dragState.mode === "node-drag") {
        moveSelectionBy(dxScreen / viewport.zoom, dyScreen / viewport.zoom);
      }

      setDragState({
        ...dragState,
        lastClientX: event.clientX,
        lastClientY: event.clientY
      });
    };

    const onMouseUp = () => {
      setDragState({ mode: "idle" });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragState, moveSelectionBy, panBy, viewport.zoom]);

  const startPan = useCallback((clientX: number, clientY: number) => {
    setDragState({ mode: "panning", lastClientX: clientX, lastClientY: clientY });
  }, []);

  const onCanvasMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.button === 1 || (spaceHeld && event.button === 0)) {
        event.preventDefault();
        startPan(event.clientX, event.clientY);
        return;
      }

      if (event.button === 0) {
        clearSelection();
      }
    },
    [clearSelection, spaceHeld, startPan]
  );

  const onCanvasDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const world = screenToWorld(localX, localY, viewport);
      addNodeAt(world.x - 120, world.y - 30, "Node");
    },
    [addNodeAt, viewport]
  );

  const onCanvasWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;
      const direction = event.deltaY > 0 ? 0.92 : 1.08;
      zoomAt(cursorX, cursorY, direction);
    },
    [zoomAt]
  );

  const onNodeMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
      if (event.button !== 0) {
        return;
      }
      event.stopPropagation();

      if (!selectedNodeIdsSet.has(nodeId)) {
        setSelection([nodeId]);
      }

      setDragState({ mode: "node-drag", lastClientX: event.clientX, lastClientY: event.clientY });
    },
    [selectedNodeIdsSet, setSelection]
  );

  return (
    <div
      className="canvas-root"
      ref={canvasRef}
      onMouseDown={onCanvasMouseDown}
      onDoubleClick={onCanvasDoubleClick}
      onWheel={onCanvasWheel}
    >
      <GridBackground viewport={viewport} />
      <div
        className="canvas-world"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
      >
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            selected={selectedNodeIdsSet.has(node.id)}
            onMouseDown={onNodeMouseDown}
          />
        ))}
      </div>
    </div>
  );
}
