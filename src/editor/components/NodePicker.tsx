import { useEffect, useMemo, useRef, useState } from "react";
import type { NodePack, NodePreset } from "../presets/types";

export const DEFAULT_NODE_PICKER_PRESET_ID = "__default_node__";
export const PASTE_FROM_CLIPBOARD_PRESET_ID = "__paste_from_clipboard__";
export const CHECK_CLIPBOARD_PRESET_ID = "__check_clipboard_paste__";

type NodePickerProps = {
  open: boolean;
  anchorScreenX: number;
  anchorScreenY: number;
  packs: NodePack[];
  onSelect: (presetId: string) => void;
  canPasteFromClipboard?: boolean;
  canRequestClipboardPaste?: boolean;
  autoFocusSearch?: boolean;
  onClose: () => void;
};

type PickerOption = {
  presetId: string;
  title: string;
  category: string;
  packId: string;
  packLabel: string;
  tags: string[];
};

type PickerGroup = {
  key: string;
  label: string;
  options: PickerOption[];
};

export function NodePicker({
  open,
  anchorScreenX,
  anchorScreenY,
  packs,
  onSelect,
  canPasteFromClipboard = false,
  canRequestClipboardPaste = false,
  autoFocusSearch = true,
  onClose
}: NodePickerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const options = useMemo(() => flattenOptions(packs), [packs]);
  const optionsWithPaste = useMemo(() => {
    if (!canPasteFromClipboard) {
      if (canRequestClipboardPaste) {
        return [buildCheckClipboardOption(), ...options];
      }
      return options;
    }
    return [buildPasteOption(), ...options];
  }, [canPasteFromClipboard, canRequestClipboardPaste, options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const defaultOption = optionsWithPaste.find((option) => option.presetId === DEFAULT_NODE_PICKER_PRESET_ID);
    const checkClipboardOption = optionsWithPaste.find((option) => option.presetId === CHECK_CLIPBOARD_PRESET_ID);
    const pasteOption = optionsWithPaste.find((option) => option.presetId === PASTE_FROM_CLIPBOARD_PRESET_ID);
    if (!q) {
      return optionsWithPaste;
    }
    const matches = optionsWithPaste.filter((option) => {
      if (
        option.presetId === DEFAULT_NODE_PICKER_PRESET_ID ||
        option.presetId === PASTE_FROM_CLIPBOARD_PRESET_ID ||
        option.presetId === CHECK_CLIPBOARD_PRESET_ID
      ) {
        return false;
      }
      const haystack = `${option.title} ${option.packLabel} ${option.category} ${option.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
    const quick: PickerOption[] = [];
    if (pasteOption) {
      quick.push(pasteOption);
    } else if (checkClipboardOption) {
      quick.push(checkClipboardOption);
    }
    if (defaultOption) {
      quick.push(defaultOption);
    }
    return [...quick, ...matches];
  }, [optionsWithPaste, query]);

  const groups = useMemo(() => {
    const grouped = new Map<string, PickerGroup>();
    for (const option of filtered) {
      const key = `${option.packId}::${option.category}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.options.push(option);
      } else {
        grouped.set(key, {
          key,
          label: `${option.packLabel} / ${option.category}`,
          options: [option]
        });
      }
    }
    return Array.from(grouped.values());
  }, [filtered]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery("");
    setActiveIndex(0);
    if (autoFocusSearch) {
      inputRef.current?.focus();
    }
  }, [autoFocusSearch, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [onClose, open]);

  useEffect(() => {
    if (activeIndex > filtered.length - 1) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [activeIndex, filtered.length]);

  if (!open) {
    return null;
  }

  const maxLeft = typeof window !== "undefined" ? Math.max(8, window.innerWidth - 340) : anchorScreenX;
  const maxTop = typeof window !== "undefined" ? Math.max(8, window.innerHeight - 420) : anchorScreenY;
  const panelLeft = Math.min(Math.max(8, anchorScreenX), maxLeft);
  const panelTop = Math.min(Math.max(8, anchorScreenY), maxTop);

  const activeOption = filtered[activeIndex] ?? null;

  return (
    <div
      ref={rootRef}
      className="node-picker"
      style={{ left: `${panelLeft}px`, top: `${panelTop}px` }}
      role="dialog"
      aria-modal="false"
      aria-label="Add node"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActiveIndex((value) => Math.min(value + 1, Math.max(0, filtered.length - 1)));
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setActiveIndex((value) => Math.max(0, value - 1));
          return;
        }
        if (event.key === "Enter" && activeOption) {
          event.preventDefault();
          onSelect(activeOption.presetId);
        }
      }}
    >
      <div className="node-picker-header">
        <input
          ref={inputRef}
          className="node-picker-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          placeholder="Search nodes"
          aria-label="Search nodes"
        />
      </div>

      <div className="node-picker-list" role="listbox" aria-label="Node presets">
        {groups.length === 0 ? <div className="node-picker-empty">No matching nodes.</div> : null}

        {groups.map((group) => (
          <section key={group.key} className="node-picker-group">
            <header>{group.label}</header>
            {group.options.map((option) => {
              const optionIndex = filtered.findIndex((candidate) => candidate.presetId === option.presetId);
              const selected = optionIndex === activeIndex;
              return (
                <button
                  key={option.presetId}
                  className={`node-picker-option ${selected ? "is-active" : ""}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(optionIndex)}
                  onClick={() => onSelect(option.presetId)}
                >
                  <span className="node-picker-title">{option.title}</span>
                  <span className="node-picker-meta">{option.category}</span>
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}

function flattenOptions(packs: NodePack[]): PickerOption[] {
  const options: PickerOption[] = [
    {
      presetId: DEFAULT_NODE_PICKER_PRESET_ID,
      title: "Default Node",
      category: "Quick Create",
      packId: "__default__",
      packLabel: "Canvas",
      tags: ["default", "node", "quick", "create"]
    }
  ];
  for (const pack of packs) {
    for (const preset of pack.presets) {
      options.push(toOption(pack.id, pack.label, preset));
    }
  }
  return options;
}

function toOption(packId: string, packLabel: string, preset: NodePreset): PickerOption {
  return {
    presetId: preset.id,
    title: preset.title,
    category: preset.category ?? "General",
    packId,
    packLabel,
    tags: preset.tags ?? []
  };
}

function buildPasteOption(): PickerOption {
  return {
    presetId: PASTE_FROM_CLIPBOARD_PRESET_ID,
    title: "Paste from Clipboard",
    category: "Quick Create",
    packId: "__default__",
    packLabel: "Canvas",
    tags: ["paste", "clipboard", "quick", "create"]
  };
}

function buildCheckClipboardOption(): PickerOption {
  return {
    presetId: CHECK_CLIPBOARD_PRESET_ID,
    title: "Check Clipboard for Paste",
    category: "Quick Create",
    packId: "__default__",
    packLabel: "Canvas",
    tags: ["paste", "clipboard", "quick", "create", "check"]
  };
}
