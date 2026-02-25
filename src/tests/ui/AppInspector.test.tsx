import { fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../App";
import { useGraphStore } from "../../editor/store/useGraphStore";

describe("App inspector accessibility", () => {
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
});
