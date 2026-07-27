interface SegmentedControlProps<T extends string | number> {
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-bg-elevated p-1">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          disabled={opt.disabled}
          onClick={() => !opt.disabled && onChange(opt.value)}
          className={`no-drag rounded-lg px-4 py-2 text-sm font-medium transition ${
            value === opt.value
              ? "bg-[var(--accent)] text-white"
              : opt.disabled
                ? "cursor-not-allowed text-text-muted opacity-50"
                : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
