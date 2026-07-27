import { Globe, Play, X } from "lucide-react";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";

export function ActiveServerBanner() {
  const servers = useAppStore((s) => s.servers);
  const activeServerId = useAppStore((s) => s.activeServerId);
  const setActiveServer = useAppStore((s) => s.setActiveServer);
  const play = useAppStore((s) => s.play);
  const busy = useAppStore((s) => s.isPlaying || s.gameRunning);

  const active = servers.find((s) => s.id === activeServerId);
  if (!active) return null;

  return (
    <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/20 text-[var(--accent)]">
          <Globe className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-text-muted">{t("homeActiveServerHint")}</p>
          <p className="truncate text-sm font-semibold text-text-primary">
            {active.name}{" "}
            <span className="font-normal text-text-muted">
              ({active.address}:{active.port})
            </span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void play()}
          disabled={busy}
          className="no-drag btn-glow flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-current" />
          {t("connectAndPlay")}
        </button>
        <button
          type="button"
          onClick={() => setActiveServer(null)}
          className="no-drag flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition hover:bg-white/5 hover:text-text-primary"
          title={t("clearActiveServer")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
