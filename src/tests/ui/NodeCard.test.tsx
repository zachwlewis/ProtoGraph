import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NodeCard } from "../../editor/components/NodeCard";
import type { NodeModel, PinModel } from "../../editor/model/types";

function makeNode(): NodeModel {
  return {
    id: "n1",
    title: "Node",
    x: 100,
    y: 120,
    width: 280,
    height: 96,
    inputPinIds: ["in1"],
    outputPinIds: ["out1"]
  };
}

function makePins(): { inputPins: PinModel[]; outputPins: PinModel[] } {
  return {
    inputPins: [
      {
        id: "in1",
        nodeId: "n1",
        direction: "input",
        label: "In",
        color: "blue",
        type: "float",
        shape: "circle"
      }
    ],
    outputPins: [
      {
        id: "out1",
        nodeId: "n1",
        direction: "output",
        label: "Out",
        color: "yellow",
        type: "float",
        shape: "circle"
      }
    ]
  };
}

function renderCard(overrides?: {
  onRenameNode?: (nodeId: string, title: string) => void;
  onRenamePin?: (pinId: string, label: string) => void;
  connectedPinIds?: ReadonlySet<string>;
  inputShape?: PinModel["shape"];
  outputShape?: PinModel["shape"];
}) {
  const { inputPins, outputPins } = makePins();
  if (overrides?.inputShape) {
    inputPins[0].shape = overrides.inputShape;
  }
  if (overrides?.outputShape) {
    outputPins[0].shape = overrides.outputShape;
  }
  const onRenameNode = overrides?.onRenameNode ?? vi.fn();
  const onRenamePin = overrides?.onRenamePin ?? vi.fn();

  render(
    <NodeCard
      node={makeNode()}
      inputPins={inputPins}
      outputPins={outputPins}
      selected={false}
      isConnecting={false}
      hoveredPinId={null}
      hoveredPinValid={false}
      connectedPinIds={overrides?.connectedPinIds ?? new Set()}
      onMouseDown={vi.fn()}
      onPinMouseDown={vi.fn()}
      onPinMouseUp={vi.fn()}
      onPinMouseEnter={vi.fn()}
      onPinMouseLeave={vi.fn()}
      onRenameNode={onRenameNode}
      onRenamePin={onRenamePin}
    />
  );

  return { onRenameNode, onRenamePin };
}

describe("NodeCard inline editing", () => {
  it("commits node title edit on Enter", async () => {
    const user = userEvent.setup();
    const { onRenameNode } = renderCard();

    const title = screen.getByText("Node");
    await user.dblClick(title);

    const input = screen.getByDisplayValue("Node");
    await user.clear(input);
    await user.type(input, "Blend{enter}");

    expect(onRenameNode).toHaveBeenCalledWith("n1", "Blend");
  });

  it("cancels node title edit on Escape", async () => {
    const user = userEvent.setup();
    const { onRenameNode } = renderCard();

    await user.dblClick(screen.getByText("Node"));
    const input = screen.getByDisplayValue("Node");
    await user.type(input, " Temp{escape}");

    expect(onRenameNode).not.toHaveBeenCalled();
    expect(screen.getByText("Node")).toBeInTheDocument();
  });

  it("commits pin label edit on blur", async () => {
    const user = userEvent.setup();
    const { onRenamePin } = renderCard();

    await user.dblClick(screen.getByText("In"));
    const input = screen.getByDisplayValue("In");
    await user.clear(input);
    await user.type(input, "Input");
    await user.tab();

    expect(onRenamePin).toHaveBeenCalledWith("in1", "Input");
  });

  it("renders shape classes and connected state classes", () => {
    const { container, rerender } = render(
      <NodeCard
        node={makeNode()}
        inputPins={[{ ...makePins().inputPins[0], shape: "diamond" }]}
        outputPins={[{ ...makePins().outputPins[0], shape: "execution" }]}
        selected={false}
        isConnecting={false}
        hoveredPinId={null}
        hoveredPinValid={false}
        connectedPinIds={new Set(["in1"])}
        onMouseDown={vi.fn()}
        onPinMouseDown={vi.fn()}
        onPinMouseUp={vi.fn()}
        onPinMouseEnter={vi.fn()}
        onPinMouseLeave={vi.fn()}
        onRenameNode={vi.fn()}
        onRenamePin={vi.fn()}
      />
    );

    const pins = container.querySelectorAll(".pin-dot");
    expect(pins[0].className).toContain("pin-shape-diamond");
    expect(pins[0].className).toContain("is-connected");
    expect(pins[1].className).toContain("pin-shape-execution");
    expect(pins[1].className).toContain("is-unconnected");

    rerender(
      <NodeCard
        node={makeNode()}
        inputPins={[{ ...makePins().inputPins[0], shape: "circle" }]}
        outputPins={[{ ...makePins().outputPins[0], shape: "square" }]}
        selected={false}
        isConnecting={false}
        hoveredPinId={null}
        hoveredPinValid={false}
        connectedPinIds={new Set()}
        onMouseDown={vi.fn()}
        onPinMouseDown={vi.fn()}
        onPinMouseUp={vi.fn()}
        onPinMouseEnter={vi.fn()}
        onPinMouseLeave={vi.fn()}
        onRenameNode={vi.fn()}
        onRenamePin={vi.fn()}
      />
    );

    const nextPins = container.querySelectorAll(".pin-dot");
    expect(nextPins[0].className).toContain("pin-shape-circle");
    expect(nextPins[1].className).toContain("pin-shape-square");
  });
});
