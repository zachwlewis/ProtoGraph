import {
  parseClipboardText,
  serializeClipboardPayload
} from "../../editor/model/clipboard";
import { buildClipboardPayloadFromSelection, createNode, makeGraph, setSelectedNodes } from "../../editor/model/graphMutations";

describe("clipboard payload format", () => {
  it("serializes and parses valid clipboard envelopes", () => {
    const [withNode, nodeId] = createNode(makeGraph(), { x: 10, y: 20, title: "Node" });
    const selected = setSelectedNodes(withNode, [nodeId]);
    const payload = buildClipboardPayloadFromSelection(selected);
    expect(payload).toBeTruthy();
    if (!payload) {
      throw new Error("Expected payload");
    }

    const text = serializeClipboardPayload(payload, "graph_1");
    const parsed = parseClipboardText(text);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error("Expected parsed payload");
    }
    expect(parsed.payload.graph.order).toEqual([nodeId]);
  });

  it("rejects malformed clipboard JSON", () => {
    const parsed = parseClipboardText("{bad-json");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("Expected parse failure");
    }
    expect(parsed.reason).toBe("invalid-json");
  });

  it("rejects unsupported envelopes", () => {
    const parsed = parseClipboardText(
      JSON.stringify({
        kind: "not-protograph",
        version: 1,
        payload: {}
      })
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("Expected parse failure");
    }
    expect(parsed.reason).toBe("invalid-envelope");
  });
});
