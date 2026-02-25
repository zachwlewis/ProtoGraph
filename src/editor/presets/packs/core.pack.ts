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
      pins: [{ label: "Exec", direction: "output", type: "Exec", color: "#ffb655" }]
    },
    {
      id: "core.branch",
      title: "Branch",
      category: "Flow",
      tags: ["if", "condition"],
      pins: [
        { label: "Exec In", direction: "input", type: "Exec", color: "#58c4ff" },
        { label: "Condition", direction: "input", type: "Bool", color: "#7fe3ff", shape: "diamond" },
        { label: "True", direction: "output", type: "Exec", color: "#ffb655" },
        { label: "False", direction: "output", type: "Exec", color: "#ffb655" }
      ]
    },
    {
      id: "core.print",
      title: "Print",
      category: "Utility",
      tags: ["debug", "log"],
      pins: [
        { label: "Exec In", direction: "input", type: "Exec", color: "#58c4ff" },
        { label: "Value", direction: "input", type: "Any", color: "#58c4ff" },
        { label: "Exec Out", direction: "output", type: "Exec", color: "#ffb655" }
      ]
    }
  ]
};
