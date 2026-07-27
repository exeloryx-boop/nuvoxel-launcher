import { Lightbulb, X } from "lucide-react";
import { useMemo, useState } from "react";
import { t } from "../../i18n";
import { pickLauncherTipKey } from "../../data/launcherTips";
import { SHIMMER_SURFACE } from "../../utils/shimmer";

export function LauncherTipBanner() {
  const tipKey = useMemo(
    () => pickLauncherTipKey(new Date().getDate() + new Date().getMonth() * 31),
    [],
  );
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={`${SHIMMER_SURFACE} mb-4 flex shrink-0 items-start gap-3 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-4 py-3 backdrop-blur-sm`}>
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          {t("launcherTipTitle")}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {t(tipKey)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="no-drag shrink-0 rounded-lg p-1 text-text-muted transition hover:bg-white/5 hover:text-text-primary"
        title={t("close")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
