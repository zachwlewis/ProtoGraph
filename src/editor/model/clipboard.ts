import type { EdgeModel, NodeModel, PinModel } from "./types";

export const PROTOGRAPH_CLIPBOARD_KIND = "protograph/clipboard";
export const PROTOGRAPH_CLIPBOARD_VERSION = 1;

export type ClipboardSelectionBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
};

export type ClipboardGraphSubset = {
  nodes: Record<string, NodeModel>;
  pins: Record<string, PinModel>;
  edges: Record<string, EdgeModel>;
  order: string[];
  edgeOrder: string[];
};

export type ProtoGraphClipboardPayloadV1 = {
  selectionBounds: ClipboardSelectionBounds;
  graph: ClipboardGraphSubset;
};

export type ClipboardEnvelopeV1 = {
  kind: typeof PROTOGRAPH_CLIPBOARD_KIND;
  version: typeof PROTOGRAPH_CLIPBOARD_VERSION;
  copiedAt: number;
  source?: {
    graphId?: string | null;
    app?: "ProtoGraph";
  };
  payload: ProtoGraphClipboardPayloadV1;
};

export type ParsedClipboardText =
  | { ok: true; payload: ProtoGraphClipboardPayloadV1 }
  | { ok: false; reason: "invalid-json" | "invalid-envelope" | "invalid-payload" };

export function serializeClipboardPayload(
  payload: ProtoGraphClipboardPayloadV1,
  sourceGraphId?: string | null
): string {
  const envelope: ClipboardEnvelopeV1 = {
    kind: PROTOGRAPH_CLIPBOARD_KIND,
    version: PROTOGRAPH_CLIPBOARD_VERSION,
    copiedAt: Date.now(),
    source: {
      graphId: sourceGraphId ?? null,
      app: "ProtoGraph"
    },
    payload
  };
  return JSON.stringify(envelope, null, 2);
}

export function parseClipboardText(text: string): ParsedClipboardText {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  if (!isRecord(parsed)) {
    return { ok: false, reason: "invalid-envelope" };
  }
  if (parsed.kind !== PROTOGRAPH_CLIPBOARD_KIND || parsed.version !== PROTOGRAPH_CLIPBOARD_VERSION) {
    return { ok: false, reason: "invalid-envelope" };
  }
  if (!isProtoGraphClipboardPayloadV1(parsed.payload)) {
    return { ok: false, reason: "invalid-payload" };
  }

  return { ok: true, payload: parsed.payload };
}

export function isProtoGraphClipboardPayloadV1(value: unknown): value is ProtoGraphClipboardPayloadV1 {
  if (!isRecord(value) || !isRecord(value.graph) || !isRecord(value.selectionBounds)) {
    return false;
  }
  if (!Array.isArray(value.graph.order) || !Array.isArray(value.graph.edgeOrder)) {
    return false;
  }
  if (!isRecord(value.graph.nodes) || !isRecord(value.graph.pins) || !isRecord(value.graph.edges)) {
    return false;
  }

  const bounds = value.selectionBounds;
  const numericBounds = [
    bounds.minX,
    bounds.minY,
    bounds.maxX,
    bounds.maxY,
    bounds.centerX,
    bounds.centerY
  ];
  return numericBounds.every((num) => typeof num === "number" && Number.isFinite(num));
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object";
}
