import { History, Play } from "lucide-react";

import { t } from "../../i18n";

import { useAppStore } from "../../store/useAppStore";
import { SHIMMER_SURFACE } from "../../utils/shimmer";

import type { LaunchHistoryEntry } from "../../types/mods";



const LOADER_COLORS: Record<string, string> = {

  vanilla: "bg-zinc-500/20 text-zinc-300",

  fabric: "bg-amber-500/20 text-amber-300",

  forge: "bg-orange-500/20 text-orange-300",

  quilt: "bg-violet-500/20 text-violet-300",

  neoforge: "bg-red-500/20 text-red-300",

};



export function QuickLaunchPanel({ compact = false }: { compact?: boolean }) {

  const launchHistory = useAppStore((s) => s.launchHistory);

  const quickLaunchFromHistory = useAppStore((s) => s.quickLaunchFromHistory);

  const busy = useAppStore((s) => s.isPlaying || s.gameRunning);

  const quickLaunchDoubleClick = useAppStore((s) => s.quickLaunchDoubleClick);

  const entries = launchHistory.slice(0, 4);

  if (entries.length === 0) {
    return (
      <div
        className={`${SHIMMER_SURFACE} rounded-2xl border border-dashed border-white/10 bg-black/25 backdrop-blur-xl ${
          compact ? "px-4 py-3" : "px-5 py-4"
        }`}
      >

        <div className="mb-1 flex items-center gap-2">

          <History className="h-4 w-4 text-[var(--accent)]" />

          <h3 className="text-sm font-semibold text-text-primary">{t("quickLaunch")}</h3>

        </div>

        <p className="text-xs text-text-muted">{t("quickLaunchEmpty")}</p>

      </div>

    );

  }



  return (
    <div
      className={`${SHIMMER_SURFACE} rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl ${
        compact ? "p-3" : "p-4"
      }`}
    >

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-text-primary">{t("quickLaunch")}</h3>
        </div>
        {!compact ? (
          <span className="hidden text-[11px] text-text-muted sm:inline">{t("quickLaunchDesc")}</span>
        ) : null}
      </div>

      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        {entries.map((entry) => (
          <QuickLaunchItem
            key={entry.id}
            entry={entry}
            compact={compact}
            doubleClickLaunch={quickLaunchDoubleClick}
            disabled={busy}
            onLaunch={() => void quickLaunchFromHistory(entry)}
          />
        ))}
      </div>

    </div>

  );

}



function QuickLaunchItem({
  entry,
  compact,
  doubleClickLaunch,
  disabled,
  onLaunch,
}: {
  entry: LaunchHistoryEntry;
  compact?: boolean;
  doubleClickLaunch?: boolean;
  disabled: boolean;
  onLaunch: () => void;
}) {
  const loaderClass =
    LOADER_COLORS[entry.loader] ?? "bg-white/10 text-text-secondary";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={doubleClickLaunch ? undefined : onLaunch}
      onDoubleClick={doubleClickLaunch ? onLaunch : undefined}
      title={doubleClickLaunch ? t("quickLaunchDoubleClickDesc") : undefined}

      className={`no-drag group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] text-left transition hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 disabled:opacity-50 ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      }`}

    >

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] transition group-hover:bg-[var(--accent)]/25">

        <Play className="h-4 w-4 fill-current" />

      </span>

      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-medium text-text-primary">

          {entry.label ?? entry.version}

        </p>

        <div className="mt-0.5 flex items-center gap-1.5">

          <span className="truncate text-[11px] text-text-muted">{entry.version}</span>

          <span

            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${loaderClass}`}

          >

            {entry.loader}

          </span>

        </div>

      </div>

    </button>

  );

}

