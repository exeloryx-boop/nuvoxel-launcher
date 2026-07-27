import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Server,
  Star,
  Users,
} from "lucide-react";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { useServerPingStatus } from "../../hooks/useServerPingStatus";
import { SHIMMER_SURFACE } from "../../utils/shimmer";

export function FavoriteServersPanel({ compact = false }: { compact?: boolean }) {
  const servers = useAppStore((s) => s.servers);
  const activeServerId = useAppStore((s) => s.activeServerId);
  const setActiveServer = useAppStore((s) => s.setActiveServer);
  const play = useAppStore((s) => s.play);
  const busy = useAppStore((s) => s.isPlaying || s.gameRunning);

  const favorites = useMemo(
    () => servers.filter((s) => s.favorite).slice(0, 3),
    [servers],
  );
  const { statusMap, refresh } = useServerPingStatus(favorites);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handlePlay = (id: string) => {
    setActiveServer(id);
    void play();
  };

  if (favorites.length === 0) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-yellow-500/80 text-yellow-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("favoriteServersHome")}
            </span>
          </div>
          <Link
            to="/servers"
            className="text-sm text-[var(--accent)] transition hover:underline"
          >
            {t("goToServers")}
          </Link>
        </div>
        <Link
          to="/servers"
          className={`${SHIMMER_SURFACE} group flex items-center gap-4 rounded-xl border border-dashed border-white/10 bg-black/25 backdrop-blur-sm transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 ${
            compact ? "px-4 py-3" : "px-5 py-4"
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-text-muted transition group-hover:bg-[var(--accent)]/15 group-hover:text-[var(--accent)]">
            <Plus className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">{t("favoriteServersEmpty")}</p>
            <p className="mt-0.5 text-xs text-text-muted">{t("favoriteServersEmptyHint")}</p>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-yellow-500/80 text-yellow-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("favoriteServersHome")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="no-drag flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-text-muted transition hover:bg-white/10 hover:text-text-primary disabled:opacity-50"
            title={t("refreshServerStatus")}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin-slow" : ""}`} />
          </button>
          <Link
            to="/servers"
            className="text-sm text-[var(--accent)] transition hover:underline"
          >
            {t("goToServers")}
          </Link>
        </div>
      </div>

      <div
        className={`grid gap-2 ${
          compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 gap-3 sm:grid-cols-3"
        }`}
      >
        {favorites.map((srv) => {
          const st = statusMap[srv.id];
          const isActive = srv.id === activeServerId;
          const online = st?.online;

          return (
            <div
              key={srv.id}
              className={`${SHIMMER_SURFACE} group relative overflow-hidden rounded-xl border backdrop-blur-md transition ${
                isActive
                  ? "border-[var(--accent)]/50 bg-[var(--accent)]/10"
                  : online
                    ? "border-green-500/20 bg-black/35 hover:border-green-500/35"
                    : "border-white/10 bg-black/30 hover:border-white/20"
              } ${compact ? "p-3" : "p-4"}`}
            >
              {online ? (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-400/60 to-transparent" />
              ) : null}

              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      online ? "bg-green-500/15 text-green-400" : "bg-white/5 text-[var(--accent)]"
                    }`}
                  >
                    {st?.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{srv.name}</p>
                    <p className="truncate text-[11px] text-text-muted">
                      {srv.address}:{srv.port}
                    </p>
                  </div>
                </div>
                {isActive ? (
                  <span className="shrink-0 rounded-md bg-[var(--accent)]/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]">
                    {t("activeServerBadge")}
                  </span>
                ) : null}
              </div>

              <div className="mb-3 min-h-[1.25rem]">
                {st?.loading ? (
                  <span className="text-xs text-text-muted">{t("serverPingLoading")}</span>
                ) : online ? (
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="accent-pulse-dot h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
                    {t("serverOnline")}
                    {st.players !== undefined ? (
                      <span className="flex items-center gap-1 text-text-secondary">
                        <Users className="h-3 w-3" />
                        {st.players}
                        {st.maxPlayers ? `/${st.maxPlayers}` : ""}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">{t("serverOffline")}</span>
                )}
                {st?.motd && !st.loading ? (
                  <p className="mt-1 line-clamp-1 text-[11px] text-text-muted">{st.motd}</p>
                ) : null}
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => handlePlay(srv.id)}
                className="no-drag btn-glow flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {t("playOnServer")}
              </button>
            </div>
          );
        })}

        {favorites.length < 3
          ? Array.from({ length: 3 - favorites.length }).map((_, i) => (
              <Link
                key={`empty-${i}`}
                to="/servers"
                className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 text-center backdrop-blur-sm transition hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 ${
                  compact ? "h-[120px] px-2" : "h-[140px] px-3"
                }`}
              >
                <Server className="mb-1.5 h-5 w-5 text-text-muted" />
                <span className="text-xs font-medium text-text-secondary">{t("addFavoriteServer")}</span>
              </Link>
            ))
          : null}
      </div>
    </div>
  );
}
