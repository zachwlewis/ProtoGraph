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
        color: "#53c1ff",
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
        color: "#ffba4f",
        type: "float",
        shape: "circle"
      }
    ]
  };
}

function renderCard(overrides?: {
  onRenameNode?: (nodeId: string, title: string) => void;
  onRenamePin?: (pinId: string, label: string) => void;
}) {
  const { inputPins, outputPins } = makePins();
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
});
