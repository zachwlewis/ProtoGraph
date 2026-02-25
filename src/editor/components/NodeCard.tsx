import { useEffect, useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import type { NodeModel, PinModel } from "../model/types";
import { layoutTokens } from "../theme/layoutTokens";
import { getPinShapeSvgPoints } from "../utils/pinShapeGeometry";

type NodeCardProps = {
  node: NodeModel;
  inputPins: PinModel[];
  outputPins: PinModel[];
  selected: boolean;
  isConnecting: boolean;
  hoveredPinId: string | null;
  hoveredPinValid: boolean;
  connectedPinIds: ReadonlySet<string>;
  onMouseDown: (event: MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onPinMouseDown: (event: MouseEvent<HTMLButtonElement>, pinId: string) => void;
  onPinMouseUp: (event: MouseEvent<HTMLButtonElement>, pinId: string) => void;
  onPinMouseEnter: (pinId: string) => void;
  onPinMouseLeave: (pinId: string) => void;
  onRenameNode: (nodeId: string, title: string) => void;
  onRenamePin: (pinId: string, label: string) => void;
};

export function NodeCard({
  node,
  inputPins,
  outputPins,
  selected,
  isConnecting,
  hoveredPinId,
  hoveredPinValid,
  connectedPinIds,
  onMouseDown,
  onPinMouseDown,
  onPinMouseUp,
  onPinMouseEnter,
  onPinMouseLeave,
  onRenameNode,
  onRenamePin
}: NodeCardProps) {
  const [editingNode, setEditingNode] = useState(false);
  const [nodeDraft, setNodeDraft] = useState(node.title);
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [pinDraft, setPinDraft] = useState("");

  useEffect(() => {
    if (!editingNode) {
      setNodeDraft(node.title);
    }
  }, [editingNode, node.title]);

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
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <div
        className="node-title"
        onDoubleClick={(event) => {
          event.stopPropagation();
          setEditingNode(true);
        }}
      >
        {editingNode ? (
          <input
            className="inline-edit-input"
            autoFocus
            value={nodeDraft}
            onChange={(event) => setNodeDraft(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            onBlur={() => {
              onRenameNode(node.id, nodeDraft);
              setEditingNode(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onRenameNode(node.id, nodeDraft);
                setEditingNode(false);
              } else if (event.key === "Escape") {
                setNodeDraft(node.title);
                setEditingNode(false);
              }
            }}
            onMouseDown={(event) => event.stopPropagation()}
          />
        ) : (
          node.title
        )}
      </div>
      <div className="node-body">
        <div className="pin-column">
          {inputPins.map((pin) => (
            <div className="pin-row pin-row-input" key={pin.id}>
              <button
                className={pinClass(
                  pin.id,
                  pin.shape,
                  connectedPinIds.has(pin.id),
                  isConnecting,
                  hoveredPinId,
                  hoveredPinValid
                )}
                style={pinStyle(pin.color)}
                onMouseDown={(event) => onPinMouseDown(event, pin.id)}
                onMouseUp={(event) => onPinMouseUp(event, pin.id)}
                onMouseEnter={() => onPinMouseEnter(pin.id)}
                onMouseLeave={() => onPinMouseLeave(pin.id)}
                title={`${pin.label} (${pin.type})`}
                data-shape={pin.shape}
              >
                {renderPinGlyph(pin.shape)}
              </button>
              {renderPinLabel(
                pin,
                editingPinId,
                pinDraft,
                setEditingPinId,
                setPinDraft,
                onRenamePin
              )}
            </div>
          ))}
        </div>

        <div className="pin-column pin-column-output">
          {outputPins.map((pin) => (
            <div className="pin-row pin-row-output" key={pin.id}>
              {renderPinLabel(
                pin,
                editingPinId,
                pinDraft,
                setEditingPinId,
                setPinDraft,
                onRenamePin
              )}
              <button
                className={pinClass(
                  pin.id,
                  pin.shape,
                  connectedPinIds.has(pin.id),
                  isConnecting,
                  hoveredPinId,
                  hoveredPinValid
                )}
                style={pinStyle(pin.color)}
                onMouseDown={(event) => onPinMouseDown(event, pin.id)}
                onMouseUp={(event) => onPinMouseUp(event, pin.id)}
                onMouseEnter={() => onPinMouseEnter(pin.id)}
                onMouseLeave={() => onPinMouseLeave(pin.id)}
                title={`${pin.label} (${pin.type})`}
                data-shape={pin.shape}
              >
                {renderPinGlyph(pin.shape)}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function pinClass(
  pinId: string,
  pinShape: PinModel["shape"],
  isConnected: boolean,
  isConnecting: boolean,
  hoveredPinId: string | null,
  hoveredPinValid: boolean
): string {
  const classes = ["pin-dot", `pin-shape-${pinShape}`, isConnected ? "is-connected" : "is-unconnected"];
  if (!isConnecting) {
    return classes.join(" ");
  }
  if (hoveredPinId !== pinId) {
    return classes.join(" ");
  }
  classes.push(hoveredPinValid ? "is-hover-valid" : "is-hover-invalid");
  return classes.join(" ");
}

function pinStyle(color: PinModel["color"]): CSSProperties & Record<`--${string}`, string> {
  return {
    "--pin-color": `var(--pin-color-${color})`
  };
}

function renderPinGlyph(shape: PinModel["shape"]) {
  if (shape === "circle") {
    return (
      <svg className="pin-dot-glyph" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="pin-dot-shape" cx="50" cy="50" r="30" />
      </svg>
    );
  }

  return (
    <svg className="pin-dot-glyph" viewBox="0 0 100 100" aria-hidden="true">
      <polygon className="pin-dot-shape" points={getPinShapeSvgPoints(shape)} />
    </svg>
  );
}

function renderPinLabel(
  pin: PinModel,
  editingPinId: string | null,
  pinDraft: string,
  setEditingPinId: (value: string | null) => void,
  setPinDraft: (value: string) => void,
  onRenamePin: (pinId: string, label: string) => void
) {
  const isEditing = editingPinId === pin.id;
  if (!isEditing) {
    return (
      <span
        onDoubleClick={(event) => {
          event.stopPropagation();
          setEditingPinId(pin.id);
          setPinDraft(pin.label);
        }}
      >
        {pin.label}
      </span>
    );
  }

  return (
    <input
      className="inline-edit-input"
      autoFocus
      value={pinDraft}
      onChange={(event) => setPinDraft(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={() => {
        onRenamePin(pin.id, pinDraft);
        setEditingPinId(null);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          onRenamePin(pin.id, pinDraft);
          setEditingPinId(null);
        } else if (event.key === "Escape") {
          setPinDraft(pin.label);
          setEditingPinId(null);
        }
      }}
      onMouseDown={(event) => event.stopPropagation()}
    />
  );
}
