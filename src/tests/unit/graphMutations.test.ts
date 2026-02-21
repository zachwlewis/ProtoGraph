import {
  addPinToNode,
  connectPins,
  createNode,
  deleteSelection,
  duplicateSelectedNodes,
  makeGraph,
  replaceGraphState,
  removePin,
  setAllowSameNodeConnections,
  setSelectedEdges,
  setSelectedNodes,
  setSingleInputPolicy
} from "../../editor/model/graphMutations";

describe("graphMutations", () => {
  it("creates nodes and selects the newly created node", () => {
    const graph = makeGraph();
    const [next, nodeId] = createNode(graph, { x: 10, y: 20, title: "Alpha" });

    expect(next.nodes[nodeId]).toBeDefined();
    expect(next.nodes[nodeId].title).toBe("Alpha");
    expect(next.selectedNodeIds).toEqual([nodeId]);
    expect(next.nodes[nodeId].inputPinIds.length).toBe(1);
    expect(next.nodes[nodeId].outputPinIds.length).toBe(1);
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
