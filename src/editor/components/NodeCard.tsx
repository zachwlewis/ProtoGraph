import type { MouseEvent } from "react";
import type { NodeModel } from "../model/types";

type NodeCardProps = {
  node: NodeModel;
  selected: boolean;
  onMouseDown: (event: MouseEvent<HTMLDivElement>, nodeId: string) => void;
};

export function NodeCard({ node, selected, onMouseDown }: NodeCardProps) {
  return (
    <div
      className={`node-card ${selected ? "is-selected" : ""}`}
      style={{
        width: node.width,
        height: node.height,
        transform: `translate(${node.x}px, ${node.y}px)`
      }}
      onMouseDown={(event) => onMouseDown(event, node.id)}
    >
      <div className="node-title">{node.title}</div>
      <div className="node-body">
        <div className="pin-placeholder">Inputs</div>
        <div className="pin-placeholder">Outputs</div>
      </div>
    </div>
  );
}
