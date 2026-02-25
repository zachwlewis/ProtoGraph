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
        { label: "A", direction: "input", type: "Bool", color: "#7fe3ff", shape: "diamond" },
        { label: "B", direction: "input", type: "Bool", color: "#7fe3ff", shape: "diamond" },
        { label: "Result", direction: "output", type: "Bool", color: "#ffb655", shape: "diamond" }
      ]
    },
    {
      id: "logic.or",
      title: "OR",
      category: "Boolean",
      tags: ["||", "bool"],
      pins: [
        { label: "A", direction: "input", type: "Bool", color: "#7fe3ff", shape: "diamond" },
        { label: "B", direction: "input", type: "Bool", color: "#7fe3ff", shape: "diamond" },
        { label: "Result", direction: "output", type: "Bool", color: "#ffb655", shape: "diamond" }
      ]
    },
    {
      id: "logic.equal",
      title: "Equal",
      category: "Compare",
      tags: ["==", "compare"],
      pins: [
        { label: "A", direction: "input", type: "Any", color: "#58c4ff" },
        { label: "B", direction: "input", type: "Any", color: "#58c4ff" },
        { label: "Result", direction: "output", type: "Bool", color: "#ffb655", shape: "diamond" }
      ]
    }
  ]
};
