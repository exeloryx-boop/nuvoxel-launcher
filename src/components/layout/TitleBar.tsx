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
      className={`app-titlebar ${SHIMMER_SURFACE} relative z-20 flex h-12 shrink-0 items-center justify-between overflow-hidden border-b border-white/[0.07] bg-[#101316]/90 backdrop-blur-xl px-4 select-none`}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-200/25 to-transparent" />

      <div className="relative z-10 flex items-center gap-3">
        <span className="rounded-md border border-emerald-300/15 bg-emerald-300/[0.06] px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200">
          Launcher
        </span>
        <span className="text-xs font-bold tracking-wide text-text-primary">
          {t("appName")}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
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
      className={`flex h-8 w-9 items-center justify-center rounded-lg text-text-secondary transition-all duration-200 hover:bg-white/[0.08] hover:text-text-primary active:scale-95 ${
        danger ? "hover:bg-red-500 hover:text-white" : ""
      }`}
    >
      {icon}
    </button>
  );
}
