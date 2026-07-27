import type { SkinModel } from "@shared/skins";
import { useTranslation } from "../../hooks/useTranslation";

interface SkinModelPickerProps {
  value: SkinModel;
  onChange: (model: SkinModel) => void;
  compact?: boolean;
}

export function SkinModelPicker({
  value,
  onChange,
  compact = false,
}: SkinModelPickerProps) {
  const { t } = useTranslation();

  const options: { id: SkinModel; label: string }[] = [
    { id: "classic", label: t("skinModelClassic") },
    { id: "slim", label: t("skinModelSlim") },
  ];

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {t("skinModel")}
          </p>
          <p className="text-xs text-text-muted">{t("skinModelDesc")}</p>
        </div>
      )}
      <div className="flex gap-2">
        {options.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`no-drag flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              value === id
                ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                : "border-border bg-bg-card text-text-secondary hover:border-white/20 hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
