import { NavLink } from "react-router-dom";
import { Home, Layers, Server, Settings, User } from "lucide-react";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { useComfortableLayout } from "../../hooks/useComfortableLayout";
import { SHIMMER_SURFACE } from "../../utils/shimmer";

const navItems = [
  { to: "/", icon: Home, labelKey: "navHome" as const },
  { to: "/mods", icon: Layers, labelKey: "navMods" as const },
  { to: "/servers", icon: Server, labelKey: "navServers" as const },
  { to: "/accounts", icon: User, labelKey: "navAccounts" as const },
  { to: "/settings", icon: Settings, labelKey: "navSettings" as const },
];

export function Sidebar() {
  const sidebarCompactPref = useAppStore((s) => s.sidebarCompact);
  const glow = useAppStore((s) => s.sidebarGlow);
  const comfortable = useComfortableLayout();
  const compact = sidebarCompactPref || !comfortable;

  return (
    <aside
      className={`${SHIMMER_SURFACE} relative flex shrink-0 flex-col overflow-hidden border-r border-white/10 bg-bg-secondary/80 backdrop-blur-xl transition-all duration-300 ${
        compact ? "w-[76px]" : "w-[260px]"
      }`}
    >
      {/* Background glowing gradient spot */}
      <div className="pointer-events-none absolute -left-20 top-1/4 h-48 w-48 rounded-full bg-[var(--accent)]/10 blur-3xl" />

      <div className={`relative z-10 py-6 ${compact ? "px-2.5" : "px-4"}`}>
        {!compact ? (
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">
            {t("menu")}
          </p>
        ) : null}
        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              title={compact ? t(labelKey) : undefined}
              className={({ isActive }) =>
                `no-drag relative group flex items-center gap-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  compact ? "justify-center px-2 py-3" : "px-4 py-3"
                } ${
                  isActive
                    ? glow
                      ? "border border-[var(--accent)]/50 bg-gradient-to-r from-[var(--accent)]/25 to-[var(--accent)]/5 text-white shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent),inset_0_1px_0_rgba(255,255,255,0.2)]"
                      : "border border-[var(--accent)]/40 bg-[var(--accent)]/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                    : "border border-transparent text-text-secondary hover:border-white/10 hover:bg-white/5 hover:text-text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator glowing bar on left */}
                  {isActive && !compact ? (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                  ) : null}

                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-[var(--accent)] drop-shadow-[0_0_8px_var(--accent)]" : "text-text-secondary"
                    }`}
                  />
                  {!compact ? (
                    <span className={`truncate ${isActive ? "font-bold text-white" : ""}`}>
                      {t(labelKey)}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
