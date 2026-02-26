import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../App";

describe("App home workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows Home when there are no saved graphs and hides toolbar New Graph button", async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelector(".home-screen")).toBeTruthy();
    });
    expect(container.querySelector('button[aria-label="New Graph"]')).toBeNull();
  });

  it("creates a blank graph from Home and can navigate back with Home button", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(container.querySelector(".home-action-button.is-primary") as HTMLButtonElement);

    await waitFor(() => {
      expect(container.querySelector(".home-screen")).toBeNull();
    });

    const homeButton = container.querySelector('button[aria-label="Home"]') as HTMLButtonElement;
    await user.click(homeButton);

    await waitFor(() => {
      expect(container.querySelector(".home-screen")).toBeTruthy();
    });
  });

  it("creates a graph from template and shows editor canvas", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const templateButton = Array.from(container.querySelectorAll(".home-template-card")).find((button) =>
      button.textContent?.includes("Basic Flow")
    ) as HTMLButtonElement | undefined;
    expect(templateButton).toBeTruthy();

    await user.click(templateButton!);

    await waitFor(() => {
      expect(container.querySelector(".home-screen")).toBeNull();
    });
    await waitFor(() => {
      expect(container.querySelectorAll(".node-card").length).toBeGreaterThan(0);
    });
  });

  it("deleting the last graph from Home returns to empty Home state", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(container.querySelector(".home-action-button.is-primary") as HTMLButtonElement);
    await waitFor(() => {
      expect(container.querySelector(".home-screen")).toBeNull();
    });

    await user.click(container.querySelector('button[aria-label="Home"]') as HTMLButtonElement);
    await waitFor(() => {
      expect(container.querySelector(".home-screen")).toBeTruthy();
    });

    await user.click(container.querySelector(".home-graph-actions .is-danger") as HTMLButtonElement);

    await waitFor(() => {
      expect(container.textContent).toContain("No saved graphs yet.");
    });
  });

  it("keeps Graph Info management controls in the editor dock", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(container.querySelector(".home-action-button.is-primary") as HTMLButtonElement);

    await waitFor(() => {
      expect(container.querySelector(".home-screen")).toBeNull();
    });

    await user.click(container.querySelector('.dock-icon-btn[aria-label="Graph Info"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(container.textContent).toContain("Delete Graph");
      expect(container.textContent).toContain("Duplicate");
    });
  });
});
