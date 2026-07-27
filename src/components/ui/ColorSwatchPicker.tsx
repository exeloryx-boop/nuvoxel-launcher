import { Check } from "lucide-react";
import type { AccentColor } from "../../types";
import { ACCENT_COLORS } from "../../types";

const COLORS: AccentColor[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
  "rgb",
];

interface ColorSwatchPickerProps {
  value: AccentColor;
  onChange: (color: AccentColor) => void;
}

export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {COLORS.map((color) => {
        const selected = value === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`no-drag relative flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              selected
                ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-bg-card"
                : "hover:scale-105"
            }`}
            style={{
              background:
                color === "rgb"
                  ? "linear-gradient(135deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7)"
                  : ACCENT_COLORS[color].hex,
            }}
          >
            {selected && <Check className="h-5 w-5 text-white" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
