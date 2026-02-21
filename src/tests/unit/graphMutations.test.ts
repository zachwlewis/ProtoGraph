import {
  createNode,
  deleteSelectedNodes,
  duplicateSelectedNodes,
  makeGraph,
  setSelectedNodes
} from "../../editor/model/graphMutations";

describe("graphMutations", () => {
  it("creates nodes and selects the newly created node", () => {
    const graph = makeGraph();
    const [next, nodeId] = createNode(graph, { x: 10, y: 20, title: "Alpha" });

    expect(next.nodes[nodeId]).toBeDefined();
    expect(next.nodes[nodeId].title).toBe("Alpha");
    expect(next.selectedNodeIds).toEqual([nodeId]);
  });

  it("deletes selected nodes", () => {
    const base = makeGraph();
    const [graphWithOne, a] = createNode(base, { x: 0, y: 0 });
    const [graphWithTwo, b] = createNode(graphWithOne, { x: 100, y: 100 });

    const selected = setSelectedNodes(graphWithTwo, [a, b]);
    const next = deleteSelectedNodes(selected);

    expect(next.nodes[a]).toBeUndefined();
    expect(next.nodes[b]).toBeUndefined();
    expect(next.selectedNodeIds).toHaveLength(0);
  });

  it("duplicates selected nodes with offset", () => {
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
});
