import type { ReactNode } from "react";

import { useEffect, useState } from "react";

import {
  Clock,
  Copy,
  LogIn,
  LogOut,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Trash2,
  Trophy,
  Users,
  ArrowUpCircle,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";

import { t } from "../i18n";

import {

  useActiveAccount,

  useActiveModPack,

  useAppStore,

  useHasAccount,

} from "../store/useAppStore";

import { VersionSelector } from "../components/modals/VersionSelector";

import { MinecraftAvatar } from "../components/ui/MinecraftAvatar";

import { QuickLaunchPanel } from "../components/home/QuickLaunchPanel";
import { LauncherTipBanner } from "../components/home/LauncherTipBanner";
import { FavoriteServersPanel } from "../components/home/FavoriteServersPanel";
import { ActiveServerBanner } from "../components/home/ActiveServerBanner";
import { usePackModUpdates } from "../hooks/usePackModUpdates";
import { ACHIEVEMENTS } from "../data/achievements";
import { formatPlayTime } from "../utils/format";
import { getHomeBackgroundStyle } from "../utils/homeBackgrounds";
import { maskPrivateText } from "../utils/privacyMask";
import { useComfortableLayout } from "../hooks/useComfortableLayout";
import { SHIMMER_SURFACE } from "../utils/shimmer";
import { SystemDetectionBanner } from "../components/home/SystemDetectionBanner";
import { SystemDiagnosticsWidget } from "../components/home/SystemDiagnosticsWidget";
import { VoxelCanvas } from "../components/home/VoxelCanvas";



function useLivePlayTimeSeconds() {

  const playTimeSeconds = useAppStore((s) => s.achievementStats.playTimeSeconds);

  const gameRunning = useAppStore((s) => s.gameRunning);

  const sessionStart = useAppStore((s) => s.achievementStats.gameSessionStart);

  const [, tick] = useState(0);



  useEffect(() => {

    if (!gameRunning) return;

    const id = window.setInterval(() => tick((n) => n + 1), 30_000);

    return () => clearInterval(id);

  }, [gameRunning]);



  if (!gameRunning || !sessionStart) return playTimeSeconds;

  return playTimeSeconds + Math.floor((Date.now() - sessionStart) / 1000);

}



export function HomePage() {

  const account = useActiveAccount();

  const hasAccount = useHasAccount();

  const activePack = useActiveModPack();

  const play = useAppStore((s) => s.play);

  const setShowAddAccountModal = useAppStore((s) => s.setShowAddAccountModal);

  const setShowNuvoxelLogin = useAppStore((s) => s.setShowNuvoxelLogin);

  const setShowAddFriendModal = useAppStore((s) => s.setShowAddFriendModal);

  const setShowChatModal = useAppStore((s) => s.setShowChatModal);

  const nuvoxelSession = useAppStore((s) => s.nuvoxelSession);

  const friends = useAppStore((s) => s.friends);
  const localFriends = useAppStore((s) => s.localFriends);

  const socialApiOnline = useAppStore((s) => s.socialApiOnline);

  const gameRunning = useAppStore((s) => s.gameRunning);

  const isPlaying = useAppStore((s) => s.isPlaying);

  const logoutNuvoxelId = useAppStore((s) => s.logoutNuvoxelId);

  const removeFriend = useAppStore((s) => s.removeFriend);

  const refreshFriends = useAppStore((s) => s.refreshFriends);

  const totalLaunches = useAppStore((s) => s.achievementStats.totalLaunches);

  const unlockedAchievements = useAppStore((s) => s.unlockedAchievements);

  const homeBackgroundEnabled = useAppStore((s) => s.homeBackgroundEnabled);
  const homeBlurPercent = useAppStore((s) => s.homeBlurPercent);
  const homeDimPercent = useAppStore((s) => s.homeDimPercent);
  const homeBackgroundPreset = useAppStore((s) => s.homeBackgroundPreset);
  const streamerMode = useAppStore((s) => s.streamerMode);
  const showHomeStats = useAppStore((s) => s.showHomeStats);
  const showLauncherTips = useAppStore((s) => s.showLauncherTips);

  const livePlaySeconds = useLivePlayTimeSeconds();
  const blurPx = (homeBlurPercent / 100) * 24;
  const dimOpacity = homeDimPercent / 100;
  const bgStyle = getHomeBackgroundStyle(homeBackgroundPreset);
  const hidePrivate = streamerMode === "hide";
  const comfortable = useComfortableLayout();
  const { updateCount, checking: checkingUpdates } = usePackModUpdates(activePack ?? undefined);



  const [codeCopied, setCodeCopied] = useState(false);

  const [refreshingFriends, setRefreshingFriends] = useState(false);



  const allFriends = [
    ...friends.map((f) => ({ ...f, isLocal: false as const })),
    ...localFriends.map((f) => ({ ...f, isLocal: true as const })),
  ];

  const onlineFriends = friends.filter((f) => f.online);

  const onlineCount = onlineFriends.length;

  const busy = isPlaying || gameRunning;

  const achievementCount = Object.keys(unlockedAchievements).length;

  const achievementTotal = ACHIEVEMENTS.length;



  const playTimeLabel = formatPlayTime(livePlaySeconds, {

    hours: (h) => t("playTimeHours").replace("{h}", String(h)),

    minutes: (m) => t("playTimeMinutes").replace("{m}", String(m)),

    hoursMinutes: (h, m) =>

      t("playTimeHoursMinutes").replace("{h}", String(h)).replace("{m}", String(m)),

  });



  const modTags = activePack

    ? [

        ...(activePack.mods ?? [])

          .slice(0, 3)

          .map((m) => m.name),

        activePack.loader.charAt(0).toUpperCase() + activePack.loader.slice(1),

      ].filter(Boolean)

    : [t("minecraft")];



  const copyFriendCode = async () => {

    if (!nuvoxelSession) return;

    try {

      await navigator.clipboard.writeText(nuvoxelSession.friendCode);

      setCodeCopied(true);

      setTimeout(() => setCodeCopied(false), 2000);

    } catch {

      /* ignore */

    }

  };



  const handleRefreshFriends = async () => {

    setRefreshingFriends(true);

    await refreshFriends();

    setRefreshingFriends(false);

  };



  return (

    <div className="relative h-full min-h-0 overflow-x-hidden overflow-y-auto">

      {homeBackgroundEnabled && homeBackgroundPreset !== "none" ? (
        homeBackgroundPreset === "voxel" ? (
          <VoxelCanvas />
        ) : (
          <div
            className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center"
            style={{
              backgroundImage: bgStyle.image
                ? `url(${bgStyle.image}), ${bgStyle.gradient}`
                : bgStyle.gradient,
              filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
            }}
          />
        )
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 bg-bg-primary"
        style={{ opacity: homeBackgroundEnabled ? dimOpacity : 1 }}
      />

      {homeBackgroundEnabled ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 via-bg-primary/40 to-bg-primary/95" />
      ) : null}



      <div
        className={`relative z-10 flex h-full min-h-0 flex-col ${
          comfortable ? "p-6" : "p-4"
        }`}
      >

        {showLauncherTips ? <LauncherTipBanner /> : null}

        {gameRunning ? (

          <div className="mb-4 flex shrink-0 items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 backdrop-blur-md">

            <span className="accent-pulse-dot h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />

            <span className="text-sm font-medium text-green-300">{t("gameRunningNow")}</span>

          </div>

        ) : null}

        <ActiveServerBanner />

        <SystemDetectionBanner />

        <SystemDiagnosticsWidget />

        <div className={`shrink-0 ${comfortable ? "mb-5" : "mb-3"}`}>

          {hasAccount && account ? (

            <>

              <p className="text-sm text-text-secondary">{t("welcomeBack")}</p>

              <h1
                className={`truncate font-bold leading-tight text-text-primary ${
                  comfortable ? "text-[2.75rem]" : "text-2xl"
                }`}
              >

                {maskPrivateText(account.username, hidePrivate)}

              </h1>

            </>

          ) : (

            <>

              <p className="text-sm text-text-secondary">{t("guestWelcome")}</p>

              <h1 className="text-2xl font-bold text-text-primary">

                {t("guestSubtitle")}

              </h1>

              <button

                type="button"

                onClick={() => setShowAddAccountModal(true)}

                className="no-drag btn-glow mt-3 flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"

              >

                <LogIn className="h-4 w-4" />

                {t("signIn")}

              </button>

            </>

          )}

        </div>



        <div
          className={`mb-5 flex min-h-0 ${
            comfortable
              ? "min-h-0 flex-1 flex-row gap-5"
              : "shrink-0 flex-col gap-3"
          }`}
        >

          <div
            className={`glass-card flex min-w-0 flex-col justify-center rounded-2xl ${
              comfortable ? "flex-1 p-8" : "p-4"
            }`}
          >

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="accent-pulse-dot h-2 w-2 shrink-0 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {t("continuePlaying")}
              </span>
              {activePack && updateCount > 0 ? (
                <Link
                  to={`/mods/${activePack.id}`}
                  className="no-drag flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-300 transition hover:bg-amber-500/25"
                >
                  <ArrowUpCircle className="h-3 w-3" />
                  {t("modUpdatesAvailable").replace("{n}", String(updateCount))}
                </Link>
              ) : activePack && checkingUpdates ? (
                <span className="text-[11px] text-text-muted">{t("checkModUpdates")}</span>
              ) : null}
            </div>

            <h2
              className={`mb-1 line-clamp-2 font-bold text-text-primary ${
                comfortable ? "text-4xl" : "text-xl"
              }`}
            >

              {activePack?.name ?? t("minecraft")}

            </h2>

            <p
              className={`text-text-secondary ${
                comfortable ? "mb-5 text-base" : "mb-3 text-sm"
              }`}
            >

              {t("chooseVersion")}

            </p>

            <div
              className={`flex flex-wrap gap-2 ${
                comfortable ? "mb-8" : "mb-0"
              }`}
            >

              {modTags.map((tag) => (

                <span

                  key={tag}

                  className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-xs font-medium text-text-secondary"

                >

                  {tag}

                </span>

              ))}

            </div>

            {comfortable ? (
            <div className="flex flex-row items-center gap-4">
              <VersionSelector />
              <button
                type="button"
                onClick={() => void play()}
                disabled={busy}
                className="no-drag btn-glow flex flex-1 items-center justify-center gap-3 rounded-xl bg-[var(--accent)] py-4 text-lg font-bold uppercase tracking-wide text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                <Play className="h-6 w-6 fill-current" />
                {t("play")}
              </button>
            </div>
            ) : null}

          </div>



          <div
            className={`flex min-w-0 flex-col gap-3 ${
              comfortable ? "w-[300px] shrink-0 gap-3" : "w-full"
            }`}
          >

            {showHomeStats ? (
            <div className="grid grid-cols-2 gap-2">

              <StatCard
                compact={!comfortable}
                icon={<Clock className="h-4 w-4" />}

                text={playTimeLabel}

                highlight={livePlaySeconds > 0}

              />

              <StatCard
                compact={!comfortable}
                icon={<Rocket className="h-4 w-4" />}

                text={t("launchesStat").replace("{n}", String(totalLaunches))}

                highlight={totalLaunches > 0}

              />

              <StatCard
                compact={!comfortable}
                icon={<Trophy className="h-4 w-4 text-yellow-500" />}

                text={t("achievementsStat")

                  .replace("{n}", String(achievementCount))

                  .replace("{total}", String(achievementTotal))}

                highlight={achievementCount > 0}

              />

              <StatCard
                compact={!comfortable}
                icon={<Users className="h-4 w-4" />}

                text={t("friendsOnlineStat").replace("{n}", String(onlineCount))}

              />

            </div>
            ) : null}



            <div
              className={`${SHIMMER_SURFACE} glass-card flex flex-1 flex-col justify-between rounded-2xl p-4 overflow-hidden min-h-0`}
            >

              <div className="mb-3 flex items-center justify-between">

                <h3 className="font-semibold text-text-primary">

                  {t("friends")}

                </h3>

                <div className="flex items-center gap-2">

                  <span className="flex items-center gap-1 text-xs text-green-400">

                    <span

                      className={`h-1.5 w-1.5 rounded-full ${

                        nuvoxelSession && socialApiOnline

                          ? "bg-green-400"

                          : "bg-text-muted"

                      }`}

                    />

                    {t("friendsOnlineCount").replace("{n}", String(onlineCount))}

                  </span>

                  {nuvoxelSession ? (
                      <button
                        type="button"
                        onClick={() => void handleRefreshFriends()}
                        disabled={refreshingFriends}
                        className="no-drag flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/15 disabled:opacity-50"
                        title={t("refreshFriends")}
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${refreshingFriends ? "animate-spin-slow" : ""}`}
                        />
                      </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setShowChatModal(true)}
                    className="no-drag flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/20 text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
                    title="Чат спільноти"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddFriendModal(true)}
                    className="no-drag flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/15"
                    title={t("addFriend")}
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                </div>

              </div>



              {nuvoxelSession && !socialApiOnline ? (
                <p className="mb-3 text-xs text-amber-400/90">
                  {t("socialApiOffline")}
                </p>
              ) : null}

              {nuvoxelSession ? (
                <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-text-muted">{t("friendCode")}</p>
                    <p className="font-mono text-sm font-bold tracking-widest text-[var(--accent)]">
                      {maskPrivateText(nuvoxelSession.friendCode, hidePrivate)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyFriendCode()}
                    className="no-drag shrink-0 rounded-lg border border-border p-1.5 text-text-muted hover:bg-white/5 hover:text-text-primary"
                    title={t("copyLabel")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}

              {codeCopied ? (
                <p className="mb-2 text-xs text-green-400">{t("friendCodeCopied")}</p>
              ) : null}

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
                {allFriends.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    {t("friendsEmpty")}
                  </p>
                ) : (
                  allFriends.map((friend) => (
                    <div
                      key={`${friend.isLocal ? "local" : "remote"}-${friend.id}`}
                      className="group flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/5 px-2.5 py-2 transition hover:border-white/10"
                    >
                      <MinecraftAvatar username={friend.username} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {friend.username}
                        </p>
                        <p className="truncate text-[11px] text-text-muted">
                          {friend.isLocal
                            ? t("friendOffline")
                            : friend.online
                              ? friend.status.startsWith("playing")
                                ? friend.status
                                : t("friendOnline")
                              : t("friendOffline")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeFriend(friend.id)}
                        className="no-drag shrink-0 rounded p-1 text-text-muted opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                        title={t("removeFriend")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          !friend.isLocal && friend.online ? "bg-green-400" : "bg-text-muted"
                        }`}
                      />
                    </div>
                  ))
                )}
              </div>

              {!nuvoxelSession ? (
                <button
                  type="button"
                  onClick={() => setShowNuvoxelLogin(true)}
                  className="no-drag mt-3 w-full rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 py-2.5 text-sm font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
                >
                  {t("loginNuvoxelId")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => logoutNuvoxelId()}
                  className="no-drag mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs text-text-muted transition hover:bg-white/5 hover:text-text-primary"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t("logoutNuvoxelId")}
                </button>

              )}

            </div>

          </div>

        </div>



        <div className={`shrink-0 ${comfortable ? "mb-5" : "mb-3"}`}>
          <QuickLaunchPanel compact={!comfortable} />
        </div>

        <div className={`shrink-0 ${comfortable ? "" : "pb-2"}`}>
          <FavoriteServersPanel compact={!comfortable} />
        </div>

      </div>

    </div>

  );

}



function StatCard({
  icon,
  text,
  highlight = false,
  compact = false,
}: {
  icon: ReactNode;
  text: string;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`${SHIMMER_SURFACE} flex items-center gap-3 rounded-xl border px-3.5 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:scale-[1.02] ${
        compact ? "py-2" : "py-2.5"
      } ${
        highlight
          ? "border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent)]/15 to-transparent text-white shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_10%,transparent)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          highlight
            ? "bg-[var(--accent)]/20 text-[var(--accent)] shadow-[0_0_10px_var(--accent)]"
            : "bg-white/5 text-text-muted"
        }`}
      >
        {icon}
      </div>
      <span className={`font-semibold text-text-primary ${compact ? "text-xs" : "text-sm"}`}>{text}</span>
    </div>
  );
}

