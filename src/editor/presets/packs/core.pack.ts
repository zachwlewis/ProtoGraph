import type { NodePack } from "../types";

export const coreNodePack: NodePack = {
  id: "core",
  label: "Core",
  description: "Foundational graph building blocks.",
  presets: [
    {
      id: "core.event",
      title: "Event",
      category: "Flow",
      tags: ["entry", "flow"],
      tintColor: "yellow",
      showTitleOutputPin: true,
      pins: [{ label: "Out", direction: "output", type: "Exec", color: "white", shape: "execution" }]
    },
    {
      id: "core.branch",
      title: "Branch",
      category: "Flow",
      tags: ["if", "condition"],
      tintColor: "purple",
      showTitleInputPin: true,
      showTitleOutputPin: false,
      pins: [
        { label: "In", direction: "input", type: "Exec", color: "white", shape: "execution" },
        { label: "Condition", direction: "input", type: "Bool", color: "red", shape: "circle" },
        { label: "True", direction: "output", type: "Exec", color: "white", shape: "execution" },
        { label: "False", direction: "output", type: "Exec", color: "white", shape: "execution" }
      ]
    },
    {
      id: "core.print",
      title: "Print",
      category: "Utility",
      tags: ["debug", "log"],
      tintColor: "cyan",
      showTitleInputPin: true,
      showTitleOutputPin: true,
      pins: [
        { label: "In", direction: "input", type: "Exec", color: "white", shape: "execution" },
        { label: "Value", direction: "input", type: "Any", color: "blue", shape: "diamond" },
        { label: "Out", direction: "output", type: "Exec", color: "white", shape: "execution" }
      ]
    }
  ]
};
