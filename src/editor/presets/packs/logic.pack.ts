import type { NodePack } from "../types";

export const logicNodePack: NodePack = {
  id: "logic",
  label: "Logic",
  description: "Boolean and comparison operations.",
  presets: [
    {
      id: "logic.and",
      title: "AND",
      category: "Boolean",
      tags: ["&&", "bool"],
      pins: [
        { label: "A", direction: "input", type: "Bool", color: "red", shape: "circle" },
        { label: "B", direction: "input", type: "Bool", color: "red", shape: "circle" },
        { label: "Result", direction: "output", type: "Bool", color: "red", shape: "circle" }
      ]
    },
    {
      id: "logic.or",
      title: "OR",
      category: "Boolean",
      tags: ["||", "bool"],
      pins: [
        { label: "A", direction: "input", type: "Bool", color: "red", shape: "circle" },
        { label: "B", direction: "input", type: "Bool", color: "red", shape: "circle" },
        { label: "Result", direction: "output", type: "Bool", color: "red", shape: "circle" }
      ]
    },
    {
      id: "logic.equal",
      title: "Equal",
      category: "Compare",
      tags: ["==", "compare"],
      pins: [
        { label: "A", direction: "input", type: "Any", color: "blue", shape: "diamond" },
        { label: "B", direction: "input", type: "Any", color: "blue", shape: "diamond" },
        { label: "Result", direction: "output", type: "Bool", color: "red", shape: "circle" }
      ]
    }
  ]
};
