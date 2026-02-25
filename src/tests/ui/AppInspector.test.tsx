import { act, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../App";
import { PIN_COLOR_OPTIONS } from "../../editor/theme/pinPalette";
import { useGraphStore } from "../../editor/store/useGraphStore";

describe("App inspector accessibility", () => {
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

  it("tabs from node title input to pin input while skipping handle and delete buttons", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const nodeCard = container.querySelector(".node-card") as HTMLElement | null;
    expect(nodeCard).toBeTruthy();
    await user.click(nodeCard!);

    await waitFor(() => {
      expect(container.querySelector(".inspector-block")).toBeTruthy();
    });

    const nodeTitleInput = container.querySelector(".inspector-block > input") as HTMLInputElement | null;
    const pinHandle = container.querySelector(".inspector-block .pin-handle") as HTMLButtonElement | null;
    const pinDelete = container.querySelector(".inspector-block .pin-delete-btn") as HTMLButtonElement | null;

    expect(nodeTitleInput).toBeTruthy();
    expect(pinHandle).toBeTruthy();
    expect(pinDelete).toBeTruthy();
    expect(pinHandle?.tabIndex).toBe(-1);
    expect(pinDelete?.tabIndex).toBe(-1);

    nodeTitleInput?.focus();
    expect(document.activeElement).toBe(nodeTitleInput);

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
    const toggle = container.querySelector(".pin-advanced-toggle") as HTMLButtonElement | null;
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
});
