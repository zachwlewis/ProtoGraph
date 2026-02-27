import { fireEvent, render, waitFor } from "@testing-library/react";
import { App } from "../../App";
import { createNode, makeGraph } from "../../editor/model/graphMutations";
import { DEFAULT_EXPORT_PREFS } from "../../editor/model/types";
import { useGraphStore } from "../../editor/store/useGraphStore";

describe("App clipboard shortcuts", () => {
  const writeText = vi.fn();
  const readText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    readText.mockReset();
    writeText.mockResolvedValue(undefined);
    readText.mockResolvedValue("");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
        readText
      }
    });

    const [seeded] = createNode(makeGraph(), { x: 80, y: 100, title: "Seed Node" });
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

  it("copies and pastes selection through Cmd/Ctrl shortcuts", async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(container.querySelector(".canvas-root")).toBeTruthy();
    });
    const nodeCard = container.querySelector(".node-card") as HTMLElement | null;
    expect(nodeCard).toBeTruthy();
    fireEvent.mouseDown(nodeCard!, { button: 0 });

    fireEvent.keyDown(window, { key: "c", metaKey: true });
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });

    const copiedText = writeText.mock.calls[0]?.[0] ?? "";
    expect(copiedText).toContain("\"kind\": \"protograph/clipboard\"");

    const before = useGraphStore.getState().order.length;
    fireEvent.paste(window, {
      clipboardData: {
        getData: (type: string) => (type === "text/plain" ? copiedText : "")
      }
    });

    await waitFor(() => {
      expect(useGraphStore.getState().order.length).toBe(before + 1);
    });
  });

  it("shows an error notice and no-ops for invalid clipboard text", async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(container.querySelector(".canvas-root")).toBeTruthy();
    });
    const before = useGraphStore.getState().order.length;
    fireEvent.paste(window, {
      clipboardData: {
        getData: (type: string) => (type === "text/plain" ? "not-json" : "")
      }
    });

    await waitFor(() => {
      expect(container.textContent).toContain("Clipboard does not contain ProtoGraph data");
    });
    expect(useGraphStore.getState().order.length).toBe(before);
  });

  it("does not intercept copy shortcut when an input is focused", async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(container.querySelector(".canvas-root")).toBeTruthy();
    });

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: "c", metaKey: true });
    expect(writeText).not.toHaveBeenCalled();

    input.remove();
  });

  it("cuts selection through Cmd/Ctrl+X only after clipboard write succeeds", async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(container.querySelector(".canvas-root")).toBeTruthy();
    });
    const nodeCard = container.querySelector(".node-card") as HTMLElement | null;
    expect(nodeCard).toBeTruthy();
    fireEvent.mouseDown(nodeCard!, { button: 0 });

    const before = useGraphStore.getState().order.length;
    fireEvent.keyDown(window, { key: "x", metaKey: true });

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
    expect(useGraphStore.getState().order.length).toBe(before - 1);
  });
});
