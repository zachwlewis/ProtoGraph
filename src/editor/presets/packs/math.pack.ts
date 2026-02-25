import type { NodePack } from "../types";

export const mathNodePack: NodePack = {
  id: "math",
  label: "Math",
  description: "Basic math operators.",
  presets: [
    {
      id: "math.add",
      title: "Add",
      category: "Scalar",
      tags: ["+", "number"],
      pins: [
        { label: "A", direction: "input", type: "Float", color: "green", shape: "circle" },
        { label: "B", direction: "input", type: "Float", color: "green", shape: "circle" },
        { label: "Result", direction: "output", type: "Float", color: "green", shape: "circle" }
      ]
    },
    {
      id: "math.multiply",
      title: "Multiply",
      category: "Scalar",
      tags: ["*", "number"],
      pins: [
        { label: "A", direction: "input", type: "Float", color: "green", shape: "circle" },
        { label: "B", direction: "input", type: "Float", color: "green", shape: "circle" },
        { label: "Result", direction: "output", type: "Float", color: "green", shape: "circle" }
      ]
    },
    {
      id: "math.lerp",
      title: "Lerp",
      category: "Interpolation",
      tags: ["blend", "interpolate"],
      pins: [
        { label: "A", direction: "input", type: "Float", color: "green", shape: "circle" },
        { label: "B", direction: "input", type: "Float", color: "green", shape: "circle" },
        { label: "Alpha", direction: "input", type: "Float", color: "green", shape: "circle" },
        { label: "Result", direction: "output", type: "Float", color: "green", shape: "circle" }
      ]
    }
  ]
};
