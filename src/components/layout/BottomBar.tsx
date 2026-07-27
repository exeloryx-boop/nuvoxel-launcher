import { ChevronDown, Loader2, LogIn, Play, User } from "lucide-react";
import { getCapeById } from "@shared/skins";
import { t } from "../../i18n";
import { useActiveAccount, useAppStore, useHasAccount } from "../../store/useAppStore";
import { MinecraftAvatar } from "../ui/MinecraftAvatar";
import { AccountSwitcher } from "../modals/AccountSwitcher";
import { VersionSelector } from "../modals/VersionSelector";
import { useComfortableLayout } from "../../hooks/useComfortableLayout";
import { SHIMMER_SURFACE } from "../../utils/shimmer";

export function BottomBar() {
  const account = useActiveAccount();
  const hasAccount = useHasAccount();
  const isPlaying = useAppStore((s) => s.isPlaying);
  const gameRunning = useAppStore((s) => s.gameRunning);
  const busy = isPlaying || gameRunning;
  const play = useAppStore((s) => s.play);
  const showAccountSwitcher = useAppStore((s) => s.showAccountSwitcher);
  const setShowAccountSwitcher = useAppStore((s) => s.setShowAccountSwitcher);
  const setShowAddAccountModal = useAppStore((s) => s.setShowAddAccountModal);
  const selectedSkin = useAppStore((s) => s.selectedSkin);
  const skinUsername = selectedSkin?.username;
  const skinModel = selectedSkin?.model ?? "classic";
  const activeCape = getCapeById(selectedSkin?.capeId);
  const comfortable = useComfortableLayout();

  return (
    <>
      <footer
        className={`${SHIMMER_SURFACE} relative z-10 overflow-hidden flex shrink-0 items-center border-t border-white/10 bg-bg-secondary/90 backdrop-blur-xl ${
          comfortable
            ? "h-[76px] justify-between gap-4 px-6"
            : "h-14 flex-nowrap justify-between gap-2 px-4"
        }`}
      >
        {/* Ambient bottom bar glow line */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

        {hasAccount && account ? (
          <button
            type="button"
            onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
            className={`no-drag flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-white/10 hover:shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_15%,transparent)] active:scale-98 ${
              comfortable ? "px-4 py-2.5" : "max-w-[150px] px-3 py-1.5"
            }`}
          >
            <div className="relative">
              <MinecraftAvatar
                username={account.username}
                skinUsername={skinUsername}
                model={skinModel}
                capeTextureUsername={activeCape?.textureUsername}
                size={comfortable ? 34 : 28}
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-bg-secondary shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <div className="flex min-w-0 flex-col text-left">
              <span
                className={`truncate font-bold text-text-primary ${
                  comfortable ? "text-sm" : "text-xs"
                }`}
              >
                {account.username}
              </span>
              {comfortable ? (
                <span className="text-[10px] font-medium text-emerald-400/90 flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  {t("friendOnline")}
                </span>
              ) : null}
            </div>
            {comfortable ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 group-hover:translate-y-0.5" />
            ) : null}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddAccountModal(true)}
            className="no-drag btn-glow flex items-center gap-2 rounded-xl border border-[var(--accent)]/60 bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/10 px-4 py-2 text-sm font-bold text-[var(--accent)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)]/30"
          >
            <User className="h-4 w-4 text-[var(--accent)] animate-pulse" />
            <span>{t("signIn")}</span>
          </button>
        )}

        <div className={comfortable ? "min-w-0 flex-1 max-w-md px-2" : "min-w-0 flex-1 px-1"}>
          <VersionSelector compact />
        </div>

        <button
          type="button"
          onClick={() => void play()}
          disabled={busy}
          className={`no-drag btn-glow flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[var(--accent)] via-[var(--accent)] to-[var(--accent-hover)] font-extrabold tracking-wider text-white uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 ${
            comfortable
              ? "h-13 min-w-[180px] px-8 text-base shadow-[0_0_25px_color-mix(in_srgb,var(--accent)_50%,transparent)]"
              : "h-10 shrink-0 px-5 text-xs shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
          }`}
        >
          {isPlaying ? (
            <Loader2 className="h-5 w-5 animate-spin-slow" />
          ) : !hasAccount ? (
            <LogIn className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 fill-current transition-transform duration-200 group-hover:scale-110" />
          )}
          <span>{hasAccount ? t("play") : t("signIn")}</span>
        </button>
      </footer>

      <AccountSwitcher />
    </>
  );
}
