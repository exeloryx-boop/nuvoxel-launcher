import { Check } from "lucide-react";
import {
  CAPE_CATALOG,
  NO_CAPE_ID,
  getCapeImageUrl,
} from "@shared/skins";
import { getCapeLabel } from "../../i18n";
import { useTranslation } from "../../hooks/useTranslation";

interface CapePickerProps {
  value: string | null;
  onChange: (capeId: string | null) => void;
}

export function CapePicker({ value, onChange }: CapePickerProps) {
  const { t } = useTranslation();
  const activeId = value ?? NO_CAPE_ID;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-text-primary">{t("capeTitle")}</p>
        <p className="text-xs text-text-muted">{t("capeDesc")}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {CAPE_CATALOG.map((cape) => {
          const active = activeId === cape.id;
          const isNone = cape.id === NO_CAPE_ID;
          return (
            <button
              key={cape.id}
              type="button"
              onClick={() => onChange(isNone ? null : cape.id)}
              className={`no-drag relative flex flex-col items-center rounded-xl border p-2.5 transition ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-border bg-bg-card hover:border-white/20"
              }`}
            >
              <div className="mb-2 flex h-10 w-full items-center justify-center rounded-lg bg-bg-elevated">
                {isNone ? (
                  <span className="text-xs text-text-muted">—</span>
                ) : (
                  <img
                    src={getCapeImageUrl(cape.textureUsername)}
                    alt=""
                    className="max-h-8 max-w-full object-contain"
                    style={{ imageRendering: "pixelated" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
              <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight">
                {getCapeLabel(cape.nameKey)}
              </span>
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]">
                  <Check className="h-3 w-3 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
