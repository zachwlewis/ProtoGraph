import { fireEvent, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../App";
import { createNode, makeGraph } from "../../editor/model/graphMutations";
import { DEFAULT_EXPORT_PREFS } from "../../editor/model/types";
import { useGraphStore } from "../../editor/store/useGraphStore";

describe("Node picker", () => {
  beforeEach(() => {
    window.localStorage.clear();
    const [seeded] = createNode(makeGraph(), { x: 120, y: 120, title: "Example Node" });
    window.localStorage.setItem(
      "protograph.library.v2",
      JSON.stringify({
        version: 2,
        activeGraphId: "graph_seed",
        order: ["graph_seed"],
        settings: {
          navigationMode: "auto",
          resolvedNavigationMode: null
        },
        graphs: {
          graph_seed: {
            id: "graph_seed",
            name: "Seed",
            updatedAt: Date.now(),
            graph: seeded,
            exportPrefs: { ...DEFAULT_EXPORT_PREFS },
            themePresetId: "midnight"
          }
        }
      })
    );
  });

  it("opens on right-click without drag", async () => {
    const { container } = render(<App />);
    const canvas = container.querySelector(".canvas-root") as HTMLDivElement | null;
    expect(canvas).toBeTruthy();

    fireEvent.mouseDown(canvas!, { button: 2, clientX: 260, clientY: 180 });
    fireEvent.mouseUp(window, { button: 2, clientX: 260, clientY: 180 });

    await waitFor(() => {
      expect(container.querySelector(".node-picker")).toBeTruthy();
    });
  });

  it("opens on right-click while in trackpad mode", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(within(document.body).getByLabelText("Settings"));
    await user.click(within(document.body).getByLabelText("Trackpad mode"));

    const canvas = container.querySelector(".canvas-root") as HTMLDivElement | null;
    expect(canvas).toBeTruthy();

    fireEvent.mouseDown(canvas!, { button: 2, clientX: 260, clientY: 180 });
    fireEvent.mouseUp(window, { button: 2, clientX: 260, clientY: 180 });

    await waitFor(() => {
      expect(container.querySelector(".node-picker")).toBeTruthy();
    });
  });

  it("does not open when right-click becomes a drag pan", async () => {
    const { container } = render(<App />);
    const canvas = container.querySelector(".canvas-root") as HTMLDivElement | null;
    expect(canvas).toBeTruthy();

    fireEvent.mouseDown(canvas!, { button: 2, clientX: 220, clientY: 180 });
    fireEvent.mouseMove(window, { clientX: 245, clientY: 210 });
    fireEvent.mouseUp(window, { button: 2, clientX: 245, clientY: 210 });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.querySelector(".node-picker")).toBeNull();
  });

  it("filters and places selected preset", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const canvas = container.querySelector(".canvas-root") as HTMLDivElement | null;
    expect(canvas).toBeTruthy();

    fireEvent.mouseDown(canvas!, { button: 2, clientX: 320, clientY: 200 });
    fireEvent.mouseUp(window, { button: 2, clientX: 320, clientY: 200 });

    const picker = await waitFor(() => {
      const value = container.querySelector(".node-picker") as HTMLElement | null;
      expect(value).toBeTruthy();
      return value!;
    });

    const search = within(picker).getByLabelText("Search nodes");
    await user.type(search, "multiply");
    await user.click(within(picker).getByRole("option", { name: /Multiply/i }));

    await waitFor(() => {
      expect(container.querySelector(".node-picker")).toBeNull();
    });

    const titles = useGraphStore
      .getState()
      .order.map((id) => useGraphStore.getState().nodes[id]?.title)
      .filter((value): value is string => Boolean(value));
    expect(titles).toContain("Multiply");
  });

  it("double-click creates a default node and does not open picker", async () => {
    const { container } = render(<App />);
    const canvas = container.querySelector(".canvas-root") as HTMLDivElement | null;
    expect(canvas).toBeTruthy();
    const beforeCount = useGraphStore.getState().order.length;

    fireEvent.doubleClick(canvas!, { clientX: 280, clientY: 180, button: 0 });

    await waitFor(() => {
      expect(useGraphStore.getState().order.length).toBe(beforeCount + 1);
    });
    expect(container.querySelector(".node-picker")).toBeNull();
    const newestNodeId = useGraphStore.getState().order[useGraphStore.getState().order.length - 1];
    expect(useGraphStore.getState().nodes[newestNodeId]?.title).toBe("Node");
  });

  it("opens picker when releasing pin-drag on canvas and connects after selection", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const canvas = container.querySelector(".canvas-root") as HTMLDivElement | null;
    expect(canvas).toBeTruthy();

    const stateBefore = useGraphStore.getState();
    const sourceNodeId = stateBefore.order[0];
    const sourcePinId = stateBefore.nodes[sourceNodeId].outputPinIds[0];
    const sourcePinButton = container.querySelector(".node-card .pin-row-output .pin-dot") as HTMLButtonElement | null;
    expect(sourcePinButton).toBeTruthy();

    fireEvent.mouseDown(sourcePinButton!, { button: 0, clientX: 200, clientY: 160 });
    fireEvent.mouseMove(window, { clientX: 360, clientY: 220 });
    fireEvent.mouseUp(canvas!, { button: 0, clientX: 360, clientY: 220 });

    const picker = await waitFor(() => {
      const value = container.querySelector(".node-picker") as HTMLElement | null;
      expect(value).toBeTruthy();
      return value!;
    });

    await user.type(within(picker).getByLabelText("Search nodes"), "print");
    await user.click(within(picker).getByRole("option", { name: /Print/i }));

    await waitFor(() => {
      expect(container.querySelector(".node-picker")).toBeNull();
    });

    const stateAfter = useGraphStore.getState();
    expect(stateAfter.edgeOrder.length).toBeGreaterThan(0);
    const newestNodeId = stateAfter.order[stateAfter.order.length - 1];
    const newestNode = stateAfter.nodes[newestNodeId];
    const newestEdge = stateAfter.edges[stateAfter.edgeOrder[stateAfter.edgeOrder.length - 1]];
    expect(newestEdge.fromPinId).toBe(sourcePinId);
    expect(newestEdge.toPinId).toBe(newestNode.inputPinIds[0]);
  });
});
