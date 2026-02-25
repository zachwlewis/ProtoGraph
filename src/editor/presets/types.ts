import type { PinColor, PinDirection, PinShape } from "../model/types";

export type PinPreset = {
  label: string;
  direction: PinDirection;
  type?: string;
  color?: PinColor;
  shape?: PinShape;
};

export type NodePreset = {
  id: string;
  title: string;
  width?: number;
  pins: PinPreset[];
  isCondensed?: boolean;
  tintColor?: PinColor | null;
  showTitleInputPin?: boolean;
  showTitleOutputPin?: boolean;
  tags?: string[];
  category?: string;
};

export type NodePack = {
  id: string;
  label: string;
  description?: string;
  presets: NodePreset[];
};
