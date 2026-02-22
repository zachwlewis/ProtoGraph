import type { CSSProperties, MouseEvent } from "react";
import type { NodeModel, PinModel } from "../model/types";
import { layoutTokens } from "../theme/layoutTokens";

type NodeCardProps = {
  node: NodeModel;
  inputPins: PinModel[];
  outputPins: PinModel[];
  selected: boolean;
  isConnecting: boolean;
  hoveredPinId: string | null;
  hoveredPinValid: boolean;
  onMouseDown: (event: MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onPinMouseDown: (event: MouseEvent<HTMLButtonElement>, pinId: string) => void;
  onPinMouseUp: (event: MouseEvent<HTMLButtonElement>, pinId: string) => void;
  onPinMouseEnter: (pinId: string) => void;
  onPinMouseLeave: (pinId: string) => void;
};

export function NodeCard({
  node,
  inputPins,
  outputPins,
  selected,
  isConnecting,
  hoveredPinId,
  hoveredPinValid,
  onMouseDown,
  onPinMouseDown,
  onPinMouseUp,
  onPinMouseEnter,
  onPinMouseLeave
}: NodeCardProps) {
  const style: CSSProperties & Record<`--${string}`, string> = {
    width: `${node.width}px`,
    height: `${node.height}px`,
    transform: `translate(${node.x}px, ${node.y}px)`,
    "--node-title-height": `${layoutTokens.node.titleHeight}px`,
    "--pin-top-padding": `${layoutTokens.pin.topPadding}px`,
    "--node-body-bottom-padding": `${layoutTokens.node.bodyBottomPadding}px`,
    "--pin-radius": `${layoutTokens.pin.radius}px`,
    "--pin-diameter": `${layoutTokens.pin.radius * 2}px`,
    "--pin-label-gap": `${layoutTokens.pin.labelGap}px`,
    "--pin-row-height": `${layoutTokens.pin.rowHeight}px`,
    "--pin-font-size": `${layoutTokens.text.pinSize}px`
  };

  return (
    <div
      className={`node-card ${selected ? "is-selected" : ""}`}
      style={style}
      onMouseDown={(event) => onMouseDown(event, node.id)}
    >
      <div className="node-title">{node.title}</div>
      <div className="node-body">
        <div className="pin-column">
          {inputPins.map((pin) => (
            <div className="pin-row pin-row-input" key={pin.id}>
              <button
                className={pinClass(pin.id, isConnecting, hoveredPinId, hoveredPinValid)}
                style={{ backgroundColor: pin.color }}
                onMouseDown={(event) => onPinMouseDown(event, pin.id)}
                onMouseUp={(event) => onPinMouseUp(event, pin.id)}
                onMouseEnter={() => onPinMouseEnter(pin.id)}
                onMouseLeave={() => onPinMouseLeave(pin.id)}
                title={`${pin.label} (${pin.type})`}
              />
              <span>{pin.label}</span>
            </div>
          ))}
        </div>

        <div className="pin-column pin-column-output">
          {outputPins.map((pin) => (
            <div className="pin-row pin-row-output" key={pin.id}>
              <span>{pin.label}</span>
              <button
                className={pinClass(pin.id, isConnecting, hoveredPinId, hoveredPinValid)}
                style={{ backgroundColor: pin.color }}
                onMouseDown={(event) => onPinMouseDown(event, pin.id)}
                onMouseUp={(event) => onPinMouseUp(event, pin.id)}
                onMouseEnter={() => onPinMouseEnter(pin.id)}
                onMouseLeave={() => onPinMouseLeave(pin.id)}
                title={`${pin.label} (${pin.type})`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function pinClass(
  pinId: string,
  isConnecting: boolean,
  hoveredPinId: string | null,
  hoveredPinValid: boolean
): string {
  if (!isConnecting) {
    return "pin-dot";
  }
  if (hoveredPinId !== pinId) {
    return "pin-dot";
  }
  return hoveredPinValid ? "pin-dot is-hover-valid" : "pin-dot is-hover-invalid";
}
