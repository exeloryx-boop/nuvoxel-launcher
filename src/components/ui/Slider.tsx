interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  marks?: { value: number; label: string }[];
  className?: string;
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  marks,
  className = "",
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/10" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--accent)]"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="no-drag relative z-10 w-full"
        />
      </div>
      {marks && (
        <div className="mt-2 flex justify-between">
          {marks.map((m) => (
            <span
              key={m.value}
              className={`text-xs ${
                value === m.value
                  ? "font-medium text-[var(--accent)]"
                  : "text-text-muted"
              }`}
            >
              {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
