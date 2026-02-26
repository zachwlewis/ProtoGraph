import { act, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../App";
import { createNode, makeGraph } from "../../editor/model/graphMutations";
import { DEFAULT_EXPORT_PREFS } from "../../editor/model/types";
import { PIN_COLOR_OPTIONS } from "../../editor/theme/pinPalette";
import { useGraphStore } from "../../editor/store/useGraphStore";

describe("App inspector accessibility", () => {
  beforeEach(() => {
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

  it("includes brutal theme variants in the global theme preset selector", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const propertiesButton = container.querySelector(
      'button[aria-label="Graph Properties"]'
    ) as HTMLButtonElement | null;
    expect(propertiesButton).toBeTruthy();
    await user.click(propertiesButton!);

    await waitFor(() => {
      expect(container.querySelector(".floating-panel-content select")).toBeTruthy();
    });

    const themeSelect = container.querySelector(".floating-panel-content select") as HTMLSelectElement | null;
    expect(themeSelect).toBeTruthy();
    const labels = Array.from(themeSelect!.options).map((option) => option.textContent);
    expect(labels).toContain("Brutal Light");
    expect(labels).toContain("Brutal Dark");
  });

  it("shows node inspector only for single selection and layout card only when enough nodes are selected", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    expect(container.querySelector(".right-floating-node")).toBeNull();
    expect(container.querySelector(".right-floating-layout")).toBeNull();

    const nodeCard = container.querySelector(".node-card") as HTMLElement | null;
    expect(nodeCard).toBeTruthy();
    await user.click(nodeCard!);

    await waitFor(() => {
      expect(container.querySelector(".right-floating-node")).toBeTruthy();
    });
    expect(container.querySelector(".right-floating-layout")).toBeNull();

    const store = useGraphStore.getState();
    const firstSelectedId = store.selectedNodeIds[0];
    expect(firstSelectedId).toBeTruthy();

    let secondNodeId = "";
    act(() => {
      secondNodeId = useGraphStore.getState().addNodeAt(320, 180, "Second Node");
      useGraphStore.getState().setSelection([firstSelectedId, secondNodeId]);
    });

    await waitFor(() => {
      expect(container.querySelector(".right-floating-layout")).toBeTruthy();
    });
    expect(container.querySelector(".right-floating-node")).toBeNull();
  });

  it("shows all layout actions when visible and disables only incompatible actions", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const nodeCard = container.querySelector(".node-card") as HTMLElement | null;
    expect(nodeCard).toBeTruthy();
    await user.click(nodeCard!);

    await waitFor(() => {
      expect(container.querySelector(".inspector-block")).toBeTruthy();
    });

    const selectedNodeId = useGraphStore.getState().selectedNodeIds[0];
    expect(selectedNodeId).toBeTruthy();

    let secondNodeId = "";
    act(() => {
      secondNodeId = useGraphStore.getState().addNodeAt(420, 240, "Third Node");
      useGraphStore.getState().setSelection([selectedNodeId, secondNodeId]);
    });

    await waitFor(() => {
      expect(container.querySelector(".right-floating-layout")).toBeTruthy();
    });

    const layoutButtons = container.querySelectorAll(".right-floating-layout .layout-grid .layout-icon-btn");
    expect(layoutButtons).toHaveLength(8);

    const alignLeft = container.querySelector(
      '.right-floating-layout button[aria-label="Align left"]'
    ) as HTMLButtonElement | null;
    const distributeHorizontal = container.querySelector(
      '.right-floating-layout button[aria-label="Distribute horizontal"]'
    ) as HTMLButtonElement | null;
    const distributeVertical = container.querySelector(
      '.right-floating-layout button[aria-label="Distribute vertical"]'
    ) as HTMLButtonElement | null;

    expect(alignLeft).toBeTruthy();
    expect(distributeHorizontal).toBeTruthy();
    expect(distributeVertical).toBeTruthy();
    expect(alignLeft?.disabled).toBe(false);
    expect(distributeHorizontal?.disabled).toBe(true);
    expect(distributeVertical?.disabled).toBe(true);
  });

  it("tabs from node title input to node advanced toggle and then pin input while skipping handle and delete buttons", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const nodeCard = container.querySelector(".node-card") as HTMLElement | null;
    expect(nodeCard).toBeTruthy();
    await user.click(nodeCard!);

    await waitFor(() => {
      expect(container.querySelector(".inspector-block")).toBeTruthy();
    });

    const nodeTitleInput = container.querySelector(".node-title-row > input") as HTMLInputElement | null;
    const nodeAdvancedToggle = container.querySelector(
      '.node-title-row .node-advanced-toggle[aria-label=\"Toggle advanced node options\"]'
    ) as HTMLButtonElement | null;
    const pinHandle = container.querySelector(".inspector-block .pin-handle") as HTMLButtonElement | null;
    const pinDelete = container.querySelector(".inspector-block .pin-delete-btn") as HTMLButtonElement | null;

    expect(nodeTitleInput).toBeTruthy();
    expect(nodeAdvancedToggle).toBeTruthy();
    expect(pinHandle).toBeTruthy();
    expect(pinDelete).toBeTruthy();
    expect(pinHandle?.tabIndex).toBe(-1);
    expect(pinDelete?.tabIndex).toBe(-1);

    nodeTitleInput?.focus();
    expect(document.activeElement).toBe(nodeTitleInput);

    await user.tab();
    expect(document.activeElement).toBe(nodeAdvancedToggle);

    await user.tab();

    const active = document.activeElement as HTMLElement | null;
    expect(active).toBeTruthy();
    expect(active?.classList.contains("pin-edit-input")).toBe(true);
    expect(active).not.toBe(pinHandle);
    expect(active).not.toBe(pinDelete);
  });

  it("updates pin order live on dragover before drop", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const nodeCard = container.querySelector(".node-card") as HTMLElement | null;
    expect(nodeCard).toBeTruthy();
    await user.click(nodeCard!);

    await waitFor(() => {
      expect(container.querySelector(".inspector-block")).toBeTruthy();
    });

    await user.click(container.querySelector(".pin-add-btn") as HTMLElement);

    const selectedNodeId = useGraphStore.getState().selectedNodeIds[0];
    expect(selectedNodeId).toBeTruthy();
    const beforeOrder = useGraphStore.getState().nodes[selectedNodeId].inputPinIds.slice();
    expect(beforeOrder.length).toBeGreaterThan(1);

    const inputGroup = container.querySelectorAll(".pin-group")[0] as HTMLElement;
    const inputRows = inputGroup.querySelectorAll(".inspector-pin-row");
    const firstHandle = inputRows[0]?.querySelector(".pin-handle") as HTMLButtonElement | null;
    const secondRow = inputRows[1] as HTMLElement | undefined;

    expect(firstHandle).toBeTruthy();
    expect(secondRow).toBeTruthy();

    const dataTransfer = {
      effectAllowed: "move",
      setData: vi.fn(),
      setDragImage: vi.fn()
    } as unknown as DataTransfer;

    fireEvent.dragStart(firstHandle!, { dataTransfer });
    await waitFor(() => {
      expect(container.querySelector(".pin-row-grouped.is-dragging")).toBeTruthy();
    });

    fireEvent.dragOver(secondRow!, { dataTransfer });

    const liveOrder = useGraphStore.getState().nodes[selectedNodeId].inputPinIds;
    expect(liveOrder[1]).toBe(beforeOrder[0]);

    fireEvent.dragEnd(firstHandle!, { dataTransfer });
  });

  it("keeps advanced pin controls collapsed by default and applies shape/color edits", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const nodeCard = container.querySelector(".node-card") as HTMLElement | null;
    expect(nodeCard).toBeTruthy();
    await user.click(nodeCard!);

    await waitFor(() => {
      expect(container.querySelector(".inspector-block")).toBeTruthy();
    });

    expect(container.querySelector(".pin-advanced-content")).toBeNull();
    const toggle = container.querySelector(
      ".inspector-pin-row .pin-advanced-toggle"
    ) as HTMLButtonElement | null;
    expect(toggle).toBeTruthy();
    await user.click(toggle!);
    expect(container.querySelector(".pin-advanced-content")).toBeTruthy();

    const selectedNodeId = useGraphStore.getState().selectedNodeIds[0];
    const pinId = selectedNodeId ? useGraphStore.getState().nodes[selectedNodeId].inputPinIds[0] : undefined;
    expect(pinId).toBeTruthy();
    if (!pinId) {
      throw new Error("Expected an input pin id");
    }

    const executionShapeBtn = container.querySelector(
      '.pin-shape-option[aria-label="Pin shape execution"]'
    ) as HTMLButtonElement | null;
    expect(executionShapeBtn).toBeTruthy();
    await user.click(executionShapeBtn!);
    expect(useGraphStore.getState().pins[pinId].shape).toBe("execution");

    const selectedColor = PIN_COLOR_OPTIONS[1];
    const colorButton = container.querySelector(
      `[aria-label="Set pin color ${selectedColor}"]`
    ) as HTMLButtonElement | null;
    expect(colorButton).toBeTruthy();
    await user.click(colorButton!);
    expect(useGraphStore.getState().pins[pinId].color).toBe(selectedColor);
  });

  it("keeps advanced node controls collapsed by default and applies node display edits", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const nodeCard = container.querySelector(".node-card") as HTMLElement | null;
    expect(nodeCard).toBeTruthy();
    await user.click(nodeCard!);

    await waitFor(() => {
      expect(container.querySelector(".inspector-block")).toBeTruthy();
    });

    expect(container.querySelector(".node-advanced-content")).toBeNull();
    const toggle = container.querySelector(
      '.node-title-row .node-advanced-toggle[aria-label=\"Toggle advanced node options\"]'
    ) as HTMLButtonElement | null;
    expect(toggle).toBeTruthy();
    await user.click(toggle!);
    expect(container.querySelector(".node-advanced-content")).toBeTruthy();

    const selectedNodeId = useGraphStore.getState().selectedNodeIds[0];
    expect(selectedNodeId).toBeTruthy();
    if (!selectedNodeId) {
      throw new Error("Expected a selected node id");
    }

    const condensedToggle = container.querySelector(
      '.node-advanced-content button[aria-label=\"Toggle node condensed\"]'
    ) as HTMLButtonElement | null;
    expect(condensedToggle).toBeTruthy();
    await user.click(condensedToggle!);
    expect(useGraphStore.getState().nodes[selectedNodeId].isCondensed).toBe(true);

    const colorButton = container.querySelector('[aria-label=\"Set node color red\"]') as HTMLButtonElement | null;
    expect(colorButton).toBeTruthy();
    await user.click(colorButton!);
    expect(useGraphStore.getState().nodes[selectedNodeId].tintColor).toBe("red");
  });
});
