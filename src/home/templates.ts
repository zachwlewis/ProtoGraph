import demoBasic from "../../demos/protograph-demo-01-basic.json";
import demoBranching from "../../demos/protograph-demo-02-branching.json";
import demoPipeline from "../../demos/protograph-demo-03-advanced-pipeline.json";
import type { GraphJsonPayload } from "../persistence/io";

export type GraphTemplate = {
  id: string;
  title: string;
  description: string;
  payload: GraphJsonPayload;
};

export const graphTemplates: GraphTemplate[] = [
  {
    id: "demo-basic",
    title: "Basic Flow",
    description: "Minimal connected graph for quick starts.",
    payload: demoBasic as GraphJsonPayload
  },
  {
    id: "demo-branching",
    title: "Branching Logic",
    description: "Split and merge style graph with framing enabled.",
    payload: demoBranching as GraphJsonPayload
  },
  {
    id: "demo-pipeline",
    title: "Advanced Pipeline",
    description: "Larger staged demo with theme and export presets.",
    payload: demoPipeline as GraphJsonPayload
  }
];
