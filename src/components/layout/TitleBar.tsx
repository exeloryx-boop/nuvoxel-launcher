import type { ReactNode } from "react";
import { Minus, Square, X } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { SHIMMER_SURFACE } from "../../utils/shimmer";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function withWindow(action: (win: {
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  close: () => Promise<void>;
}) => void): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  action(getCurrentWindow());
}

export function TitleBar() {
  const { t } = useTranslation();

  return (
    <header
      data-tauri-drag-region
      className={`app-titlebar ${SHIMMER_SURFACE} relative z-20 flex h-11 shrink-0 items-center justify-between overflow-hidden border-b border-white/10 bg-bg-secondary/90 backdrop-blur-xl px-3.5 select-none`}
    >
      {/* Top subtle accent glow gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-lg bg-[var(--accent)]/30 blur-sm" />
          <img
            src="/logo.svg"
            alt=""
            className="relative h-6 w-6 rounded-lg object-cover ring-1 ring-white/20"
          />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
          {t("appName")}
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--accent)] shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_15%,transparent)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          {t("appVersion")}
        </span>
      </div>

      <div className="relative z-10 no-drag flex items-center gap-0.5">
        <WindowButton
          onClick={() => void withWindow((win) => win.minimize())}
          icon={<Minus className="h-3.5 w-3.5" />}
          label={t("minimize")}
        />
        <WindowButton
          onClick={() => void withWindow((win) => win.toggleMaximize())}
          icon={<Square className="h-3 w-3" />}
          label={t("maximize")}
        />
        <WindowButton
          onClick={() => void withWindow((win) => win.close())}
          icon={<X className="h-4 w-4" />}
          label={t("close")}
          danger
        />
      </div>
    </header>
  );
}

function WindowButton({
  onClick,
  icon,
  label,
  danger = false,
}: {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 w-9 items-center justify-center rounded-lg text-text-secondary transition-all duration-200 hover:bg-white/10 hover:text-text-primary active:scale-95 ${
        danger ? "hover:bg-red-500 hover:text-white hover:shadow-[0_0_12px_rgba(239,68,68,0.5)]" : ""
      }`}
    >
      {icon}
    </button>
  );
}
