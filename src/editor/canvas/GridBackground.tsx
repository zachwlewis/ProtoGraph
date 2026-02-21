import type { Viewport } from "../model/types";

type GridBackgroundProps = {
  viewport: Viewport;
};

export function GridBackground({ viewport }: GridBackgroundProps) {
  const spacing = 40 * viewport.zoom;
  const offsetX = viewport.x % spacing;
  const offsetY = viewport.y % spacing;

  return (
    <div
      className="grid-background"
      style={{
        backgroundSize: `${spacing}px ${spacing}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`
      }}
    />
  );
}
