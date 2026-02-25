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
        { label: "A", direction: "input", type: "Float", color: "#58c4ff" },
        { label: "B", direction: "input", type: "Float", color: "#58c4ff" },
        { label: "Result", direction: "output", type: "Float", color: "#ffb655" }
      ]
    },
    {
      id: "math.multiply",
      title: "Multiply",
      category: "Scalar",
      tags: ["*", "number"],
      pins: [
        { label: "A", direction: "input", type: "Float", color: "#58c4ff" },
        { label: "B", direction: "input", type: "Float", color: "#58c4ff" },
        { label: "Result", direction: "output", type: "Float", color: "#ffb655" }
      ]
    },
    {
      id: "math.lerp",
      title: "Lerp",
      category: "Interpolation",
      tags: ["blend", "interpolate"],
      pins: [
        { label: "A", direction: "input", type: "Float", color: "#58c4ff" },
        { label: "B", direction: "input", type: "Float", color: "#58c4ff" },
        { label: "Alpha", direction: "input", type: "Float", color: "#58c4ff" },
        { label: "Result", direction: "output", type: "Float", color: "#ffb655" }
      ]
    }
  ]
};
