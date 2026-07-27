import { Download, Sparkles, X } from "lucide-react";
import { t } from "../../i18n";
import type { UpdateInfo } from "../../hooks/useUpdater";

interface UpdateBannerProps {
  update: UpdateInfo;
  installing: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({
  update,
  installing,
  onInstall,
  onDismiss,
}: UpdateBannerProps) {
  return (
    <div className="pointer-events-auto absolute inset-x-0 top-12 z-50 mx-auto max-w-2xl px-4">
      <div className="flex items-start gap-3 rounded-xl border border-[var(--accent)]/40 bg-bg-card/95 p-4 shadow-xl backdrop-blur-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("updateAvailableTitle")}</p>
          <p className="mt-1 text-sm text-text-secondary">
            {t("updateAvailableDesc", { version: update.version })}
          </p>
          {update.notes ? (
            <p className="mt-2 line-clamp-2 text-xs text-text-muted">{update.notes}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={installing}
              onClick={onInstall}
              className="no-drag flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {installing ? t("updateInstalling") : t("updateNow")}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="no-drag rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition hover:bg-white/5"
            >
              {t("updateLater")}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="no-drag rounded-lg p-1 text-text-muted transition hover:bg-white/5 hover:text-text-primary"
          aria-label={t("close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
