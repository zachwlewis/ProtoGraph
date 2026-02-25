import {
  alignSelection,
  addPinToNode,
  connectPins,
  createNode,
  createNodeFromPreset,
  deleteSelection,
  distributeSelection,
  duplicateSelectedNodes,
  getPinCenter,
  makeGraph,
  renameNode,
  renamePin,
  replaceGraphState,
  removePin,
  reorderPinInNode,
  setNodeCondensed,
  setNodeTintColor,
  setNodeTitlePinVisible,
  setPinColor,
  setPinShape,
  setSelectionByMarquee,
  setAllowSameNodeConnections,
  setSelectedEdges,
  setSelectedNodes,
  setSingleInputPolicy
} from "../../editor/model/graphMutations";
import type { NodePreset } from "../../editor/presets/types";
import { NODE_TITLE_HEIGHT, PIN_ROW_HEIGHT, PIN_TOP_PADDING } from "../../editor/model/types";

describe("graphMutations", () => {
  it("creates nodes and selects the newly created node", () => {
    const graph = makeGraph();
    const [next, nodeId] = createNode(graph, { x: 10, y: 20, title: "Alpha" });

    expect(next.nodes[nodeId]).toBeDefined();
    expect(next.nodes[nodeId].title).toBe("Alpha");
    expect(next.selectedNodeIds).toEqual([nodeId]);
    expect(next.nodes[nodeId].inputPinIds.length).toBe(1);
    expect(next.nodes[nodeId].outputPinIds.length).toBe(1);
    expect(next.nodes[nodeId].isCondensed).toBe(false);
    expect(next.nodes[nodeId].tintColor).toBeNull();
    expect(next.nodes[nodeId].showTitleInputPin).toBe(false);
    expect(next.nodes[nodeId].showTitleOutputPin).toBe(false);
  });

  it("creates a node from preset with ordered directional pins", () => {
    const preset: NodePreset = {
      id: "test.preset",
      title: "Blend",
      width: 280,
      pins: [
        { label: "Exec In", direction: "input", type: "Exec" },
        { label: "A", direction: "input", type: "Float" },
        { label: "Result", direction: "output", type: "Float" },
        { label: "Exec Out", direction: "output", type: "Exec" }
      ]
    };

    const graph = makeGraph();
    const [next, nodeId] = createNodeFromPreset(graph, { preset, x: 140, y: 220 });
    const node = next.nodes[nodeId];

    expect(node).toBeDefined();
    expect(node.title).toBe("Blend");
    expect(node.width).toBe(280);
    expect(node.inputPinIds).toHaveLength(2);
    expect(node.outputPinIds).toHaveLength(2);
    expect(next.pins[node.inputPinIds[0]].label).toBe("Exec In");
    expect(next.pins[node.inputPinIds[1]].label).toBe("A");
    expect(next.pins[node.outputPinIds[0]].label).toBe("Result");
    expect(next.pins[node.outputPinIds[1]].label).toBe("Exec Out");
    expect(next.selectedNodeIds).toEqual([nodeId]);
    expect(next.selectedEdgeIds).toEqual([]);
  });

  it("applies optional node display fields from preset", () => {
    const preset: NodePreset = {
      id: "test.display",
      title: "Display",
      isCondensed: false,
      tintColor: "magenta",
      showTitleInputPin: true,
      showTitleOutputPin: true,
      pins: [
        { label: "A", direction: "input" },
        { label: "B", direction: "output" }
      ]
    };

    const graph = makeGraph();
    const [next, nodeId] = createNodeFromPreset(graph, { preset, x: 0, y: 0 });
    expect(next.nodes[nodeId].tintColor).toBe("magenta");
    expect(next.nodes[nodeId].showTitleInputPin).toBe(true);
    expect(next.nodes[nodeId].showTitleOutputPin).toBe(true);
  });

  it("uses default pin values for preset pins when optional fields are omitted", () => {
    const preset: NodePreset = {
      id: "test.defaults",
      title: "Defaulted",
      pins: [{ label: "Value", direction: "input" }, { label: "Result", direction: "output" }]
    };

    const graph = makeGraph();
    const [next, nodeId] = createNodeFromPreset(graph, { preset, x: 10, y: 20 });
    const inPin = next.pins[next.nodes[nodeId].inputPinIds[0]];
    const outPin = next.pins[next.nodes[nodeId].outputPinIds[0]];

    expect(inPin.type).toBe("Any In");
    expect(inPin.color).toBe("blue");
    expect(inPin.shape).toBe("circle");
    expect(outPin.type).toBe("Any Out");
    expect(outPin.color).toBe("yellow");
    expect(outPin.shape).toBe("circle");
  });

  it("deletes selected nodes", () => {
    const base = makeGraph();
    const [graphWithOne, a] = createNode(base, { x: 0, y: 0 });
    const [graphWithTwo, b] = createNode(graphWithOne, { x: 100, y: 100 });

    const selected = setSelectedNodes(graphWithTwo, [a, b]);
    const next = deleteSelection(selected);

    expect(next.nodes[a]).toBeUndefined();
    expect(next.nodes[b]).toBeUndefined();
    expect(next.selectedNodeIds).toHaveLength(0);
  });

  it("duplicates selected nodes with offset and preserved title", () => {
    const base = makeGraph();
    const [graphWithNode, nodeId] = createNode(base, { x: 40, y: 50, title: "Math" });
    const selected = setSelectedNodes(graphWithNode, [nodeId]);
    const next = duplicateSelectedNodes(selected);

    expect(Object.keys(next.nodes)).toHaveLength(2);
    const duplicate = Object.values(next.nodes).find((node) => node.id !== nodeId);
    expect(duplicate).toBeDefined();
    expect(duplicate?.title).toBe("Math");
    expect(duplicate?.x).toBe(80);
    expect(duplicate?.y).toBe(90);
    expect(next.selectedNodeIds).toEqual([duplicate?.id]);
  });

  it("adds and removes pins", () => {
    const base = makeGraph();
    const [graphWithNode, nodeId] = createNode(base, { x: 0, y: 0 });

    const [withPin, pinId] = addPinToNode(graphWithNode, nodeId, "output", "Exec");
    expect(pinId).toBeTruthy();
    expect(withPin.nodes[nodeId].outputPinIds.length).toBe(2);

    const next = removePin(withPin, pinId!);
    expect(next.nodes[nodeId].outputPinIds.length).toBe(1);
    expect(next.pins[pinId!]).toBeUndefined();
  });

  it("connects output pin to input pin", () => {
    const base = makeGraph();
    const [withA, a] = createNode(base, { x: 0, y: 0 });
    const [withB, b] = createNode(withA, { x: 300, y: 0 });

    const fromPin = withB.nodes[b].outputPinIds[0];
    const toPin = withB.nodes[a].inputPinIds[0];

    // Correct the pins for A -> B connection.
    const fixedFromPin = withB.nodes[a].outputPinIds[0];
    const fixedToPin = withB.nodes[b].inputPinIds[0];

    expect(fromPin).toBeTruthy();
    expect(toPin).toBeTruthy();

    const result = connectPins(withB, fixedFromPin, fixedToPin);

    expect(result.success).toBe(true);
    expect(result.edgeId).toBeTruthy();
    expect(result.graph.edgeOrder.length).toBe(1);
  });

  it("rejects connecting to an occupied input when single-input policy is enabled", () => {
    const base = makeGraph();
    const [withA, a] = createNode(base, { x: 0, y: 0 });
    const [withB, b] = createNode(withA, { x: 300, y: 0 });
    const [withC, c] = createNode(withB, { x: 600, y: 0 });

    const targetInput = withC.nodes[c].inputPinIds[0];
    const firstSource = withC.nodes[a].outputPinIds[0];
    const secondSource = withC.nodes[b].outputPinIds[0];

    const first = connectPins(withC, firstSource, targetInput);
    expect(first.success).toBe(true);

    const second = connectPins(first.graph, secondSource, targetInput);
    expect(second.success).toBe(false);
    expect(second.reason).toBe("occupied");
  });

  it("allows multiple input connections when single-input policy is disabled", () => {
    const base = makeGraph();
    const [withA, a] = createNode(base, { x: 0, y: 0 });
    const [withB, b] = createNode(withA, { x: 300, y: 0 });
    const [withC, c] = createNode(withB, { x: 600, y: 0 });
    const policyOff = setSingleInputPolicy(withC, false);

    const targetInput = policyOff.nodes[c].inputPinIds[0];
    const firstSource = policyOff.nodes[a].outputPinIds[0];
    const secondSource = policyOff.nodes[b].outputPinIds[0];

    const first = connectPins(policyOff, firstSource, targetInput);
    const second = connectPins(first.graph, secondSource, targetInput);

    expect(second.success).toBe(true);
    expect(second.graph.edgeOrder.length).toBe(2);
  });

  it("deletes selected edges", () => {
    const base = makeGraph();
    const [withA, a] = createNode(base, { x: 0, y: 0 });
    const [withB, b] = createNode(withA, { x: 300, y: 0 });

    const connect = connectPins(withB, withB.nodes[a].outputPinIds[0], withB.nodes[b].inputPinIds[0]);
    expect(connect.success).toBe(true);

    const selected = setSelectedEdges(connect.graph, [connect.edgeId!]);
    const next = deleteSelection(selected);

    expect(next.edgeOrder).toHaveLength(0);
    expect(Object.keys(next.edges)).toHaveLength(0);
  });

  it("rejects same-node connections by default", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0 });
    const [withExtraOutput, extraOutput] = addPinToNode(withNode, nodeId, "output", "Exec");

    expect(extraOutput).toBeTruthy();
    const fromPin = extraOutput!;
    const toPin = withExtraOutput.nodes[nodeId].inputPinIds[0];

    const result = connectPins(withExtraOutput, fromPin, toPin);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("same-node");
  });

  it("allows same-node connections when graph rule is enabled", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0 });
    const [withExtraOutput, extraOutput] = addPinToNode(withNode, nodeId, "output", "Exec");
    const sameNodeAllowed = setAllowSameNodeConnections(withExtraOutput, true);

    const result = connectPins(sameNodeAllowed, extraOutput!, sameNodeAllowed.nodes[nodeId].inputPinIds[0]);
    expect(result.success).toBe(true);
    expect(result.graph.edgeOrder).toHaveLength(1);
  });

  it("renames nodes and pins with trimmed values", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0, title: "Node" });
    const pinId = withNode.nodes[nodeId].inputPinIds[0];

    const renamedNode = renameNode(withNode, nodeId, "  Blend  ");
    expect(renamedNode.nodes[nodeId].title).toBe("Blend");

    const renamedPin = renamePin(renamedNode, pinId, "  Source  ");
    expect(renamedPin.pins[pinId].label).toBe("Source");
  });

  it("updates pin shape and color", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0, title: "Node" });
    const pinId = withNode.nodes[nodeId].inputPinIds[0];

    const withShape = setPinShape(withNode, pinId, "execution");
    expect(withShape.pins[pinId].shape).toBe("execution");

    const withColor = setPinColor(withShape, pinId, "red");
    expect(withColor.pins[pinId].color).toBe("red");
  });

  it("updates node condensed/tint/title pin settings", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0, title: "Node" });

    const withTint = setNodeTintColor(withNode, nodeId, "cyan");
    expect(withTint.nodes[nodeId].tintColor).toBe("cyan");

    const withTitlePins = setNodeTitlePinVisible(withTint, nodeId, "input", true);
    expect(withTitlePins.nodes[nodeId].showTitleInputPin).toBe(true);

    const condensed = setNodeCondensed(withTitlePins, nodeId, true);
    expect(condensed.nodes[nodeId].isCondensed).toBe(true);
    expect(condensed.nodes[nodeId].showTitleInputPin).toBe(false);
    expect(condensed.nodes[nodeId].showTitleOutputPin).toBe(false);

    const ignoredWhileCondensed = setNodeTitlePinVisible(condensed, nodeId, "output", true);
    expect(ignoredWhileCondensed).toBe(condensed);
  });

  it("no-ops pin style updates when pin is missing or unchanged", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0, title: "Node" });
    const pinId = withNode.nodes[nodeId].inputPinIds[0];

    const unchangedShape = setPinShape(withNode, pinId, withNode.pins[pinId].shape);
    expect(unchangedShape).toBe(withNode);

    const unchangedColor = setPinColor(withNode, pinId, withNode.pins[pinId].color);
    expect(unchangedColor).toBe(withNode);

    const missingShape = setPinShape(withNode, "missing", "square");
    expect(missingShape).toBe(withNode);

    const missingColor = setPinColor(withNode, "missing", "white");
    expect(missingColor).toBe(withNode);
  });

  it("ignores empty or unchanged rename values", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0, title: "Node" });
    const pinId = withNode.nodes[nodeId].inputPinIds[0];

    const unchangedNode = renameNode(withNode, nodeId, "Node");
    expect(unchangedNode).toBe(withNode);

    const emptyNode = renameNode(withNode, nodeId, "   ");
    expect(emptyNode).toBe(withNode);

    const unchangedPin = renamePin(withNode, pinId, withNode.pins[pinId].label);
    expect(unchangedPin).toBe(withNode);

    const emptyPin = renamePin(withNode, pinId, "   ");
    expect(emptyPin).toBe(withNode);
  });

  it("selects nodes by marquee with replace and add modes", () => {
    const base = makeGraph();
    const [withA, a] = createNode(base, { x: 0, y: 0 });
    const [withB, b] = createNode(withA, { x: 320, y: 0 });

    const replaced = setSelectionByMarquee(withB, { x: -10, y: -10, width: 260, height: 180 }, "replace");
    expect(replaced.selectedNodeIds).toEqual([a]);

    const added = setSelectionByMarquee(replaced, { x: 300, y: -10, width: 260, height: 180 }, "add");
    expect(new Set(added.selectedNodeIds)).toEqual(new Set([a, b]));
  });

  it("aligns and distributes selected nodes", () => {
    const base = makeGraph();
    const [withA, a] = createNode(base, { x: 0, y: 0 });
    const [withB, b] = createNode(withA, { x: 240, y: 40 });
    const [withC, c] = createNode(withB, { x: 520, y: 90 });
    const selected = setSelectedNodes(withC, [a, b, c]);

    const aligned = alignSelection(selected, "top");
    expect(aligned.nodes[a].y).toBe(0);
    expect(aligned.nodes[b].y).toBe(0);
    expect(aligned.nodes[c].y).toBe(0);

    const distributed = distributeSelection(aligned, "horizontal");
    expect(distributed.nodes[a].x).toBe(0);
    expect(distributed.nodes[c].x).toBe(520);
    expect(distributed.nodes[b].x).toBeCloseTo(260, 5);
  });

  it("does not distribute when fewer than 3 nodes are selected", () => {
    const base = makeGraph();
    const [withA, a] = createNode(base, { x: 0, y: 0 });
    const [withB, b] = createNode(withA, { x: 240, y: 40 });
    const selected = setSelectedNodes(withB, [a, b]);

    const distributed = distributeSelection(selected, "horizontal");
    expect(distributed).toBe(selected);
  });

  it("reorders pins within the same node and direction", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0, title: "Node" });
    const [withInputA] = addPinToNode(withNode, nodeId, "input", "A");
    const [withInputB] = addPinToNode(withInputA, nodeId, "input", "B");
    const before = withInputB.nodes[nodeId].inputPinIds.slice();

    const reordered = reorderPinInNode(withInputB, nodeId, "input", 0, 2);
    const after = reordered.nodes[nodeId].inputPinIds;

    expect(after).toHaveLength(before.length);
    expect(new Set(after)).toEqual(new Set(before));
    expect(after[2]).toBe(before[0]);
  });

  it("no-ops reorder with invalid indexes", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0, title: "Node" });
    const result = reorderPinInNode(withNode, nodeId, "input", -1, 3);
    expect(result).toBe(withNode);
  });

  it("replaces graph state and sanitizes dangling references", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0, title: "Sanitize" });
    const pinId = withNode.nodes[nodeId].inputPinIds[0];
    const malformed = {
      ...withNode,
      nodes: {
        ...withNode.nodes,
        rogue: {
          ...withNode.nodes[nodeId],
          id: "rogue",
          inputPinIds: ["pin_missing"],
          outputPinIds: []
        }
      },
      order: [...withNode.order, "rogue"],
      edges: {
        edge_bad: {
          id: "edge_bad",
          fromPinId: "pin_missing",
          toPinId: pinId,
          color: "#fff"
        }
      },
      edgeOrder: ["edge_bad"]
    };

    const replaced = replaceGraphState(base, malformed);

    expect(replaced.nodes.rogue.inputPinIds).toEqual([]);
    expect(replaced.edges.edge_bad).toBeUndefined();
    expect(replaced.edgeOrder).toEqual([]);
  });

  it("sanitizes unknown pin shapes to circle when replacing graph state", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0, title: "Shape" });
    const pinId = withNode.nodes[nodeId].inputPinIds[0];
    const malformed = {
      ...withNode,
      pins: {
        ...withNode.pins,
        [pinId]: {
          ...withNode.pins[pinId],
          shape: "hexagon"
        }
      }
    };

    const replaced = replaceGraphState(base, malformed as typeof withNode);
    expect(replaced.pins[pinId].shape).toBe("circle");
  });

  it("sanitizes unknown node tint values and condensed title pin invariant", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 0, y: 0, title: "Node" });
    const malformed = {
      ...withNode,
      nodes: {
        ...withNode.nodes,
        [nodeId]: {
          ...withNode.nodes[nodeId],
          isCondensed: true,
          tintColor: "orange",
          showTitleInputPin: true,
          showTitleOutputPin: true
        }
      }
    };

    const replaced = replaceGraphState(base, malformed as typeof withNode);
    expect(replaced.nodes[nodeId].tintColor).toBeNull();
    expect(replaced.nodes[nodeId].showTitleInputPin).toBe(false);
    expect(replaced.nodes[nodeId].showTitleOutputPin).toBe(false);
  });

  it("uses title-row pin anchors when title pins are enabled", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 50, y: 70, title: "Node" });
    const inputPinId = withNode.nodes[nodeId].inputPinIds[0];
    const outputPinId = withNode.nodes[nodeId].outputPinIds[0];

    const titledIn = setNodeTitlePinVisible(withNode, nodeId, "input", true);
    const inAnchor = getPinCenter(titledIn, inputPinId);
    expect(inAnchor?.y).toBe(70 + NODE_TITLE_HEIGHT / 2);

    const titledOut = setNodeTitlePinVisible(titledIn, nodeId, "output", true);
    const outAnchor = getPinCenter(titledOut, outputPinId);
    expect(outAnchor?.y).toBe(70 + NODE_TITLE_HEIGHT / 2);
  });

  it("uses condensed body anchors without title height offset", () => {
    const base = makeGraph();
    const [withNode, nodeId] = createNode(base, { x: 50, y: 70, title: "Node", isCondensed: true });
    const inputPinId = withNode.nodes[nodeId].inputPinIds[0];
    const anchor = getPinCenter(withNode, inputPinId);
    expect(anchor?.y).toBe(70 + PIN_TOP_PADDING + PIN_ROW_HEIGHT / 2);
  });

  it("rebases id sequences after replacing graph state", () => {
    const base = makeGraph();
    const [withNode] = createNode(base, { x: 0, y: 0 });
    const imported = {
      ...withNode,
      nodes: {
        node_999: {
          ...withNode.nodes[withNode.order[0]],
          id: "node_999",
          inputPinIds: ["pin_1200"],
          outputPinIds: ["pin_1201"]
        }
      },
      pins: {
        pin_1200: {
          ...withNode.pins[withNode.nodes[withNode.order[0]].inputPinIds[0]],
          id: "pin_1200",
          nodeId: "node_999"
        },
        pin_1201: {
          ...withNode.pins[withNode.nodes[withNode.order[0]].outputPinIds[0]],
          id: "pin_1201",
          nodeId: "node_999"
        }
      },
      edges: {},
      order: ["node_999"],
      edgeOrder: []
    };

    const replaced = replaceGraphState(base, imported);
    const [next, createdNodeId] = createNode(replaced, { x: 100, y: 100 });
    expect(createdNodeId).toBe("node_1000");
    expect(next.nodes[createdNodeId]).toBeDefined();
  });
});
