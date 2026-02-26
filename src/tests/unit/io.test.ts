import { makeGraph } from "../../editor/model/graphMutations";
import { parseGraphJsonFile } from "../../persistence/io";

describe("persistence io", () => {
  function makeJsonFile(contents: string, name: string): File {
    const file = new File([contents], name, { type: "application/json" }) as File & {
      text?: () => Promise<string>;
    };
    if (typeof file.text !== "function") {
      file.text = async () => contents;
    }
    return file;
  }

  it("parses legacy raw GraphModel payload", async () => {
    const graph = makeGraph();
    const file = makeJsonFile(JSON.stringify(graph), "legacy.json");

    const parsed = await parseGraphJsonFile(file);

    expect(parsed.graph).toEqual(graph);
    expect(parsed.name).toBeNull();
    expect(parsed.themePresetId).toBeNull();
    expect(parsed.exportPrefs).toBeNull();
  });

  it("parses graph + name payload", async () => {
    const graph = makeGraph();
    const file = makeJsonFile(JSON.stringify({ graph, name: "  Named Graph  " }), "named.json");

    const parsed = await parseGraphJsonFile(file);

    expect(parsed.graph).toEqual(graph);
    expect(parsed.name).toBe("Named Graph");
    expect(parsed.themePresetId).toBeNull();
    expect(parsed.exportPrefs).toBeNull();
  });

  it("parses full metadata envelope payload", async () => {
    const graph = makeGraph();
    const file = makeJsonFile(
      JSON.stringify({
        graph,
        name: "Theme Graph",
        themePresetId: "blender",
        exportPrefs: {
          scale: 3,
          margin: 12,
          includeFrame: true,
          frameTitle: "Frame"
        }
      }),
      "full.json"
    );

    const parsed = await parseGraphJsonFile(file);

    expect(parsed.name).toBe("Theme Graph");
    expect(parsed.themePresetId).toBe("blender");
    expect(parsed.exportPrefs).toEqual({
      scale: 3,
      margin: 12,
      includeFrame: true,
      frameTitle: "Frame"
    });
  });

  it("normalizes invalid metadata values", async () => {
    const graph = makeGraph();
    const file = makeJsonFile(
      JSON.stringify({
        graph,
        name: "",
        themePresetId: "invalid-theme",
        exportPrefs: {
          scale: -5,
          margin: "bad",
          includeFrame: "yes",
          frameTitle: 123
        }
      }),
      "invalid.json"
    );

    const parsed = await parseGraphJsonFile(file);

    expect(parsed.name).toBeNull();
    expect(parsed.themePresetId).toBeNull();
    expect(parsed.exportPrefs).toEqual({
      scale: 2,
      margin: 60,
      includeFrame: false,
      frameTitle: "ProtoGraph mockup"
    });
  });

  it("accepts brutal theme metadata", async () => {
    const graph = makeGraph();
    const file = makeJsonFile(
      JSON.stringify({
        graph,
        name: "Brutal Graph",
        themePresetId: "brutal"
      }),
      "brutal.json"
    );

    const parsed = await parseGraphJsonFile(file);
    expect(parsed.name).toBe("Brutal Graph");
    expect(parsed.themePresetId).toBe("brutal");
  });

  it("accepts brutal dark theme metadata", async () => {
    const graph = makeGraph();
    const file = makeJsonFile(
      JSON.stringify({
        graph,
        name: "Brutal Dark Graph",
        themePresetId: "brutalDark"
      }),
      "brutal-dark.json"
    );

    const parsed = await parseGraphJsonFile(file);
    expect(parsed.name).toBe("Brutal Dark Graph");
    expect(parsed.themePresetId).toBe("brutalDark");
  });
});
