import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from "react";
import { GridBackground } from "./GridBackground";
import { useGraphStore } from "../store/useGraphStore";
import { NodeCard } from "../components/NodeCard";
import { screenToWorld } from "../utils/geometry";
import type { ConnectResult, WorldRect } from "../model/graphMutations";
import { getPinCenter } from "../model/graphMutations";
import type {
  EdgeModel,
  GraphModel,
  NavigationMode,
  NodeModel,
  PinModel,
  ResolvedNavigationMode
} from "../model/types";

type DragState =
  | { mode: "idle" }
  | { mode: "panning"; lastClientX: number; lastClientY: number }
  | { mode: "node-drag"; lastClientX: number; lastClientY: number }
  | { mode: "connect"; fromPinId: string; cursorWorldX: number; cursorWorldY: number }
  | { mode: "marquee"; startWorldX: number; startWorldY: number; currentWorldX: number; currentWorldY: number; append: boolean };

type InfiniteCanvasProps = {
  navigationMode: NavigationMode;
  resolvedNavigationMode: ResolvedNavigationMode;
  onResolveNavigationMode: (mode: Exclude<ResolvedNavigationMode, null>) => void;
  onConnectError: (message: string) => void;
  onRequestNodePicker: (request: {
    worldX: number;
    worldY: number;
    screenX: number;
    screenY: number;
    connectFromPinId?: string;
  }) => void;
};

export function InfiniteCanvas({
  navigationMode,
  resolvedNavigationMode,
  onResolveNavigationMode,
  onConnectError,
  onRequestNodePicker
}: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const pendingRightClickRef = useRef<{
    startClientX: number;
    startClientY: number;
    worldX: number;
    worldY: number;
    canPan: boolean;
  } | null>(null);
  const gestureScaleRef = useRef(1);
  const [dragState, setDragState] = useState<DragState>({ mode: "idle" });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [lastConnectError, setLastConnectError] = useState<string | null>(null);

  const order = useGraphStore((state) => state.order);
  const nodesById = useGraphStore((state) => state.nodes);
  const pinsById = useGraphStore((state) => state.pins);
  const edgeOrder = useGraphStore((state) => state.edgeOrder);
  const edgesById = useGraphStore((state) => state.edges);
  const selectedNodeIds = useGraphStore((state) => state.selectedNodeIds);
  const selectedEdgeIds = useGraphStore((state) => state.selectedEdgeIds);
  const viewport = useGraphStore((state) => state.viewport);
  const singleInputPolicy = useGraphStore((state) => state.singleInputPolicy);
  const allowSameNodeConnections = useGraphStore((state) => state.allowSameNodeConnections);
  const blendWireColors = useGraphStore((state) => state.blendWireColors);
  const addNodeAt = useGraphStore((state) => state.addNodeAt);
  const setSelection = useGraphStore((state) => state.setSelection);
  const setSelectionByMarquee = useGraphStore((state) => state.setSelectionByMarquee);
  const setEdgeSelection = useGraphStore((state) => state.setEdgeSelection);
  const clearSelection = useGraphStore((state) => state.clearSelection);
  const panBy = useGraphStore((state) => state.panBy);
  const zoomAt = useGraphStore((state) => state.zoomAt);
  const moveSelectionBy = useGraphStore((state) => state.moveSelectionBy);
  const connectPins = useGraphStore((state) => state.connectPins);
  const renameNode = useGraphStore((state) => state.renameNode);
  const renamePin = useGraphStore((state) => state.renamePin);
  const beginHistoryTransaction = useGraphStore((state) => state.beginHistoryTransaction);
  const endHistoryTransaction = useGraphStore((state) => state.endHistoryTransaction);

  const nodes = useMemo(
    () => order.map((id) => nodesById[id]).filter((node): node is NodeModel => node !== undefined),
    [order, nodesById]
  );
  const edges = useMemo(
    () => edgeOrder.map((id) => edgesById[id]).filter((edge): edge is EdgeModel => edge !== undefined),
    [edgeOrder, edgesById]
  );
  const connectedPinIds = useMemo(() => {
    const ids = new Set<string>();
    for (const edge of edges) {
      ids.add(edge.fromPinId);
      ids.add(edge.toPinId);
    }
    return ids;
  }, [edges]);
  const graph = useMemo<GraphModel>(
    () => ({
      nodes: nodesById,
      pins: pinsById,
      edges: edgesById,
      order,
      edgeOrder,
      selectedNodeIds,
      selectedEdgeIds,
      viewport,
      singleInputPolicy,
      allowSameNodeConnections,
      blendWireColors
    }),
    [
      allowSameNodeConnections,
      edgeOrder,
      edgesById,
      nodesById,
      order,
      pinsById,
      selectedEdgeIds,
      selectedNodeIds,
      singleInputPolicy,
      viewport,
      blendWireColors
    ]
  );

  const selectedNodeIdsSet = useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);
  const selectedEdgeIdsSet = useMemo(() => new Set(selectedEdgeIds), [selectedEdgeIds]);
  const effectiveNavigationMode = navigationMode === "auto" ? resolvedNavigationMode : navigationMode;
  const hoveredPinValid = useMemo(
    () => isHoveredPinValid(dragState, hoveredPinId, pinsById, allowSameNodeConnections),
    [allowSameNodeConnections, dragState, hoveredPinId, pinsById]
  );

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) {
      return;
    }

    const inCanvas = (event: Event & { target?: EventTarget | null; clientX?: number; clientY?: number }) => {
      const target = event.target;
      if (target instanceof Node && element.contains(target)) {
        return true;
      }
      const rect = element.getBoundingClientRect();
      const x = event.clientX;
      const y = event.clientY;
      return x !== undefined && y !== undefined && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    const onGestureStart = (event: Event) => {
      const gestureEvent = event as Event & { scale?: number; clientX?: number; clientY?: number; target?: EventTarget | null };
      if (!inCanvas(gestureEvent)) {
        return;
      }
      event.preventDefault();
      gestureScaleRef.current = gestureEvent.scale ?? 1;
    };

    const onGestureChange = (event: Event) => {
      const gestureEvent = event as Event & {
        scale?: number;
        clientX?: number;
        clientY?: number;
        target?: EventTarget | null;
      };
      if (!inCanvas(gestureEvent)) {
        return;
      }

      event.preventDefault();

      const scale = gestureEvent.scale ?? 1;
      const delta = scale / (gestureScaleRef.current || 1);
      gestureScaleRef.current = scale;

      if (!Number.isFinite(delta) || delta <= 0 || Math.abs(delta - 1) < 0.001) {
        return;
      }

      if (navigationMode === "auto" && !resolvedNavigationMode) {
        onResolveNavigationMode("trackpad");
      }

      const rect = element.getBoundingClientRect();
      const cursorX = (gestureEvent.clientX ?? rect.left + rect.width * 0.5) - rect.left;
      const cursorY = (gestureEvent.clientY ?? rect.top + rect.height * 0.5) - rect.top;
      zoomAt(cursorX, cursorY, delta);
    };

    const onGestureEnd = (event: Event) => {
      const gestureEvent = event as Event & { clientX?: number; clientY?: number; target?: EventTarget | null };
      if (inCanvas(gestureEvent)) {
        event.preventDefault();
      }
      gestureScaleRef.current = 1;
    };

    // Safari emits gesture events at the document/window level in some cases.
    window.addEventListener("gesturestart", onGestureStart as EventListener, { passive: false });
    window.addEventListener("gesturechange", onGestureChange as EventListener, { passive: false });
    window.addEventListener("gestureend", onGestureEnd as EventListener, { passive: false });

    const preventNativeWheelScrollZoom = (event: WheelEvent) => {
      event.preventDefault();
    };

    element.addEventListener("wheel", preventNativeWheelScrollZoom, { passive: false });

    return () => {
      window.removeEventListener("gesturestart", onGestureStart as EventListener);
      window.removeEventListener("gesturechange", onGestureChange as EventListener);
      window.removeEventListener("gestureend", onGestureEnd as EventListener);
      element.removeEventListener("wheel", preventNativeWheelScrollZoom);
    };
  }, [navigationMode, onResolveNavigationMode, resolvedNavigationMode, zoomAt]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
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
      const pendingRightClick = pendingRightClickRef.current;
      if (pendingRightClick && dragState.mode === "idle") {
        const dx = event.clientX - pendingRightClick.startClientX;
        const dy = event.clientY - pendingRightClick.startClientY;
        if (Math.hypot(dx, dy) >= 5) {
          if (pendingRightClick.canPan) {
            pendingRightClickRef.current = null;
            setDragState({ mode: "panning", lastClientX: event.clientX, lastClientY: event.clientY });
          } else {
            pendingRightClickRef.current = null;
          }
        }
        return;
      }

      if (dragState.mode === "idle") {
        return;
      }

      if (dragState.mode === "panning") {
        const dxScreen = event.clientX - dragState.lastClientX;
        const dyScreen = event.clientY - dragState.lastClientY;
        panBy(dxScreen, dyScreen);
        setDragState({
          ...dragState,
          lastClientX: event.clientX,
          lastClientY: event.clientY
        });
        return;
      }

      if (dragState.mode === "node-drag") {
        const dxScreen = event.clientX - dragState.lastClientX;
        const dyScreen = event.clientY - dragState.lastClientY;
        moveSelectionBy(dxScreen / viewport.zoom, dyScreen / viewport.zoom);
        setDragState({
          ...dragState,
          lastClientX: event.clientX,
          lastClientY: event.clientY
        });
        return;
      }

      if (dragState.mode === "connect") {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const world = screenToWorld(localX, localY, viewport);
        setDragState({
          ...dragState,
          cursorWorldX: world.x,
          cursorWorldY: world.y
        });
        return;
      }

      if (dragState.mode === "marquee") {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const world = screenToWorld(localX, localY, viewport);
        setDragState({
          ...dragState,
          currentWorldX: world.x,
          currentWorldY: world.y
        });
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      const pendingRightClick = pendingRightClickRef.current;
      if (pendingRightClick) {
        pendingRightClickRef.current = null;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          onRequestNodePicker(
            {
              worldX: pendingRightClick.worldX,
              worldY: pendingRightClick.worldY,
              screenX: event.clientX - rect.left,
              screenY: event.clientY - rect.top
            }
          );
        }
      }

      if (dragState.mode === "node-drag") {
        endHistoryTransaction();
      }
      if (dragState.mode === "marquee") {
        const rect: WorldRect = {
          x: Math.min(dragState.startWorldX, dragState.currentWorldX),
          y: Math.min(dragState.startWorldY, dragState.currentWorldY),
          width: Math.abs(dragState.currentWorldX - dragState.startWorldX),
          height: Math.abs(dragState.currentWorldY - dragState.startWorldY)
        };
        if (rect.width > 1 || rect.height > 1) {
          setSelectionByMarquee(rect, dragState.append ? "add" : "replace");
        }
      }
      if (dragState.mode === "connect") {
        const releasedOnPin =
          event.target instanceof Element && Boolean(event.target.closest(".pin-dot"));
        const rect = canvasRef.current?.getBoundingClientRect();
        const targetInCanvas =
          event.target instanceof Node && Boolean(canvasRef.current?.contains(event.target));
        if (!releasedOnPin && rect && targetInCanvas) {
          const localX = event.clientX - rect.left;
          const localY = event.clientY - rect.top;
          const world = screenToWorld(localX, localY, viewport);
          onRequestNodePicker({
            worldX: world.x,
            worldY: world.y,
            screenX: localX,
            screenY: localY,
            connectFromPinId: dragState.fromPinId
          });
        }
        setDragState({ mode: "idle" });
      }
      if (dragState.mode !== "idle") {
        setDragState({ mode: "idle" });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragState, endHistoryTransaction, moveSelectionBy, onRequestNodePicker, panBy, setSelectionByMarquee, viewport]);

  const startPan = useCallback((clientX: number, clientY: number) => {
    setDragState({ mode: "panning", lastClientX: clientX, lastClientY: clientY });
  }, []);

  const onCanvasMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (
        event.button === 2
      ) {
        event.preventDefault();
        if (navigationMode === "auto" && !resolvedNavigationMode) {
          onResolveNavigationMode("mouse");
        }
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const world = screenToWorld(localX, localY, viewport);
        pendingRightClickRef.current = {
          startClientX: event.clientX,
          startClientY: event.clientY,
          worldX: world.x,
          worldY: world.y,
          canPan: effectiveNavigationMode === "mouse" || (navigationMode === "auto" && !resolvedNavigationMode)
        };
        return;
      }

      if (event.button === 1 || (spaceHeld && event.button === 0)) {
        event.preventDefault();
        if (navigationMode === "auto" && !resolvedNavigationMode) {
          onResolveNavigationMode("trackpad");
        }
        startPan(event.clientX, event.clientY);
        return;
      }

      if (event.button === 0 && !spaceHeld) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const world = screenToWorld(localX, localY, viewport);
        if (!event.shiftKey) {
          clearSelection();
        }
        setDragState({
          mode: "marquee",
          startWorldX: world.x,
          startWorldY: world.y,
          currentWorldX: world.x,
          currentWorldY: world.y,
          append: event.shiftKey
        });
        return;
      }

      if (event.button === 0 && !event.shiftKey) {
        clearSelection();
      }
    },
    [
      clearSelection,
      effectiveNavigationMode,
      navigationMode,
      onResolveNavigationMode,
      resolvedNavigationMode,
      spaceHeld,
      startPan,
      viewport
    ]
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
      event.stopPropagation();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;
      const isPinch = event.ctrlKey;

      let mode = effectiveNavigationMode;
      if (navigationMode === "auto" && !mode) {
        mode = inferWheelMode(event);
        onResolveNavigationMode(mode);
      }

      if (mode === "mouse") {
        const direction = event.deltaY > 0 ? 0.92 : 1.08;
        zoomAt(cursorX, cursorY, direction);
        return;
      }

      if (isPinch) {
        const direction = event.deltaY > 0 ? 0.94 : 1.06;
        zoomAt(cursorX, cursorY, direction);
        return;
      }

      panBy(-event.deltaX, -event.deltaY);
    },
    [effectiveNavigationMode, navigationMode, onResolveNavigationMode, panBy, zoomAt]
  );

  const onNodeMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
      if (event.button !== 0) {
        return;
      }
      event.stopPropagation();
      setLastConnectError(null);

      if (event.shiftKey) {
        if (selectedNodeIdsSet.has(nodeId)) {
          setSelection(selectedNodeIds.filter((id) => id !== nodeId));
        } else {
          setSelection([...selectedNodeIds, nodeId]);
        }
        setDragState({ mode: "idle" });
        return;
      }

      if (!selectedNodeIdsSet.has(nodeId)) {
        setSelection([nodeId]);
      }

      beginHistoryTransaction();
      setDragState({ mode: "node-drag", lastClientX: event.clientX, lastClientY: event.clientY });
    },
    [beginHistoryTransaction, selectedNodeIds, selectedNodeIdsSet, setSelection]
  );

  const onPinMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>, pinId: string) => {
      if (event.button !== 0) {
        return;
      }
      event.stopPropagation();

      const pin = pinsById[pinId];
      if (!pin) {
        return;
      }

      const origin = getPinCenter(graph, pinId);
      if (!origin) {
        return;
      }

      setLastConnectError(null);
      setDragState({ mode: "connect", fromPinId: pinId, cursorWorldX: origin.x, cursorWorldY: origin.y });
    },
    [graph, pinsById]
  );

  const onPinMouseUp = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>, pinId: string) => {
      if (event.button !== 0 || dragState.mode !== "connect") {
        return;
      }
      event.stopPropagation();

      const pins = normalizeConnectionPins(dragState.fromPinId, pinId, pinsById);
      if (!pins) {
        const message = "Connect output pins to input pins only.";
        setLastConnectError(message);
        onConnectError(message);
        setDragState({ mode: "idle" });
        return;
      }
      const result = connectPins(pins.fromPinId, pins.toPinId);
      if (!result.success) {
        const message = connectionErrorText(result);
        setLastConnectError(message);
        onConnectError(message);
      }
      setDragState({ mode: "idle" });
    },
    [connectPins, dragState, onConnectError, pinsById]
  );

  const onPinMouseEnter = useCallback((pinId: string) => {
    setHoveredPinId(pinId);
  }, []);

  const onPinMouseLeave = useCallback((pinId: string) => {
    setHoveredPinId((value) => (value === pinId ? null : value));
  }, []);

  const onEdgeMouseDown = useCallback(
    (event: ReactMouseEvent<SVGPathElement>, edgeId: string) => {
      if (event.button !== 0) {
        return;
      }
      event.stopPropagation();
      setEdgeSelection([edgeId]);
      setLastConnectError(null);
    },
    [setEdgeSelection]
  );

  const previewPath = useMemo(() => {
    if (dragState.mode !== "connect") {
      return null;
    }
    const source = getPinCenter(graph, dragState.fromPinId);
    const sourcePin = pinsById[dragState.fromPinId];
    if (!source) {
      return null;
    }
    if (!sourcePin) {
      return null;
    }
    const from =
      sourcePin.direction === "output"
        ? { x: source.x, y: source.y }
        : { x: dragState.cursorWorldX, y: dragState.cursorWorldY };
    const to =
      sourcePin.direction === "output"
        ? { x: dragState.cursorWorldX, y: dragState.cursorWorldY }
        : { x: source.x, y: source.y };
    return {
      path: makeCurve(from.x, from.y, to.x, to.y),
      color: hoveredPinId && !hoveredPinValid ? "#ff5b67" : "#86d9ff"
    };
  }, [dragState, graph, hoveredPinId, hoveredPinValid, pinsById]);

  const marqueeRect = useMemo(() => {
    if (dragState.mode !== "marquee") {
      return null;
    }
    const rect: WorldRect = {
      x: Math.min(dragState.startWorldX, dragState.currentWorldX),
      y: Math.min(dragState.startWorldY, dragState.currentWorldY),
      width: Math.abs(dragState.currentWorldX - dragState.startWorldX),
      height: Math.abs(dragState.currentWorldY - dragState.startWorldY)
    };
    return rect;
  }, [dragState]);

  return (
    <div
      className="canvas-root"
      ref={canvasRef}
      tabIndex={-1}
      onMouseDown={onCanvasMouseDown}
      onDoubleClick={onCanvasDoubleClick}
      onWheel={onCanvasWheel}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
    >
      <GridBackground viewport={viewport} />
      <div
        className="canvas-world"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
      >
        <svg className="edge-layer">
          <defs>
            {blendWireColors
              ? edges.map((edge) => {
              const from = getPinCenter(graph, edge.fromPinId);
              const to = getPinCenter(graph, edge.toPinId);
              const fromPin = pinsById[edge.fromPinId];
              const toPin = pinsById[edge.toPinId];
              if (!from || !to || !fromPin || !toPin) {
                return null;
              }

              return (
                <linearGradient
                  key={`grad-${edge.id}`}
                  id={`edge-gradient-${edge.id}`}
                  gradientUnits="userSpaceOnUse"
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                >
                  <stop offset="0%" stopColor={pinColorVar(fromPin.color)} />
                  <stop offset="100%" stopColor={pinColorVar(toPin.color)} />
                </linearGradient>
              );
              })
              : null}
          </defs>
          {edges.map((edge) => {
            const from = getPinCenter(graph, edge.fromPinId);
            const to = getPinCenter(graph, edge.toPinId);
            if (!from || !to) {
              return null;
            }

            const selected = selectedEdgeIdsSet.has(edge.id);
            return (
              <path
                key={edge.id}
                className={`edge-path ${selected ? "is-selected" : ""}`}
                d={makeCurve(from.x, from.y, to.x, to.y)}
                stroke={
                  selected
                    ? undefined
                    : blendWireColors
                      ? `url(#edge-gradient-${edge.id})`
                      : "var(--pin-color-white)"
                }
                onMouseDown={(event) => onEdgeMouseDown(event, edge.id)}
              />
            );
          })}

          {previewPath ? (
            <path className="edge-path is-preview" d={previewPath.path} stroke={previewPath.color} />
          ) : null}

          {marqueeRect ? (
            <rect
              className="marquee-rect"
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.width}
              height={marqueeRect.height}
            />
          ) : null}
        </svg>

        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            inputPins={node.inputPinIds
              .map((pinId) => pinsById[pinId])
              .filter((pin): pin is PinModel => pin !== undefined)}
            outputPins={node.outputPinIds
              .map((pinId) => pinsById[pinId])
              .filter((pin): pin is PinModel => pin !== undefined)}
            selected={selectedNodeIdsSet.has(node.id)}
            isConnecting={dragState.mode === "connect"}
            hoveredPinId={hoveredPinId}
            hoveredPinValid={hoveredPinValid}
            connectedPinIds={connectedPinIds}
            onMouseDown={onNodeMouseDown}
            onPinMouseDown={onPinMouseDown}
            onPinMouseUp={onPinMouseUp}
            onPinMouseEnter={onPinMouseEnter}
            onPinMouseLeave={onPinMouseLeave}
            onRenameNode={renameNode}
            onRenamePin={renamePin}
          />
        ))}
      </div>
    </div>
  );
}

function isHoveredPinValid(
  dragState: DragState,
  hoveredPinId: string | null,
  pinsById: Record<string, PinModel>,
  allowSameNodeConnections: boolean
): boolean {
  if (dragState.mode !== "connect" || !hoveredPinId) {
    return false;
  }
  const source = pinsById[dragState.fromPinId];
  const target = pinsById[hoveredPinId];
  if (!source || !target) {
    return false;
  }
  const pins = normalizeConnectionPins(dragState.fromPinId, hoveredPinId, pinsById);
  if (!pins) {
    return false;
  }
  return allowSameNodeConnections || pinsById[pins.fromPinId].nodeId !== pinsById[pins.toPinId].nodeId;
}

function normalizeConnectionPins(
  firstPinId: string,
  secondPinId: string,
  pinsById: Record<string, PinModel>
): { fromPinId: string; toPinId: string } | null {
  const first = pinsById[firstPinId];
  const second = pinsById[secondPinId];
  if (!first || !second) {
    return null;
  }
  if (first.direction === "output" && second.direction === "input") {
    return { fromPinId: firstPinId, toPinId: secondPinId };
  }
  if (first.direction === "input" && second.direction === "output") {
    return { fromPinId: secondPinId, toPinId: firstPinId };
  }
  return null;
}

function connectionErrorText(result: ConnectResult): string {
  if (!result.reason) {
    return "Unable to connect pins.";
  }

  switch (result.reason) {
    case "direction":
      return "Connect output pins to input pins only.";
    case "same-node":
      return "Same-node connections are disabled by graph rules.";
    case "occupied":
      return "This input already has a connection.";
    case "duplicate":
      return "Those pins are already connected.";
    default:
      return "Invalid connection target.";
  }
}

function makeCurve(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1);
  const c = Math.max(48, dx * 0.45);
  return `M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`;
}

function inferWheelMode(event: ReactWheelEvent<HTMLDivElement>): "mouse" | "trackpad" {
  if (event.ctrlKey) {
    return "trackpad";
  }
  if (Math.abs(event.deltaX) > 0) {
    return "trackpad";
  }
  const absY = Math.abs(event.deltaY);
  if (absY >= 80 && absY % 4 === 0) {
    return "mouse";
  }
  return "trackpad";
}

function pinColorVar(color: PinModel["color"]): string {
  return `var(--pin-color-${color})`;
}
