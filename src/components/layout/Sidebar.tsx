import { NavLink } from "react-router-dom";
import {
  Boxes,
  Home,
  Layers3,
  Server,
  Settings2,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { useComfortableLayout } from "../../hooks/useComfortableLayout";

const navItems = [
  { to: "/", icon: Home, labelKey: "navHome" as const, group: "play" },
  { to: "/nuvoxel", icon: WandSparkles, label: "Nuvoxel Visual", group: "play" },
  { to: "/mods", icon: Layers3, labelKey: "navMods" as const, group: "library" },
  { to: "/claude-packs", icon: Boxes, labelKey: "navClaudePacks" as const, group: "library" },
  { to: "/servers", icon: Server, labelKey: "navServers" as const, group: "social" },
  { to: "/accounts", icon: UserRound, labelKey: "navAccounts" as const, group: "social" },
  { to: "/settings", icon: Settings2, labelKey: "navSettings" as const, group: "system" },
];

export function Sidebar() {
  const sidebarCompactPref = useAppStore((s) => s.sidebarCompact);
  const comfortable = useComfortableLayout();
  const compact = sidebarCompactPref || !comfortable;
  const groups = ["play", "library", "social", "system"] as const;

  return (
    <aside
      className={`launcher-sidebar relative flex shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#0c0f12]/95 transition-all duration-300 ${
        compact ? "w-[78px]" : "w-[258px]"
      }`}
    >
      <div className={`relative z-10 ${compact ? "px-3 pt-5" : "px-4 pt-6"}`}>
        <div className={`mb-8 flex items-center ${compact ? "justify-center" : "gap-3 px-2"}`}>
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-300/20 bg-gradient-to-br from-emerald-300 via-teal-400 to-cyan-400 shadow-[0_12px_28px_rgba(45,212,191,.18)]">
            <img src="/logo.svg" alt="" className="h-6 w-6" />
          </div>
          {!compact ? (
            <div className="min-w-0">
              <p className="text-sm font-black tracking-[0.18em] text-white">NUVOXEL</p>
              <p className="mt-0.5 text-[9px] font-bold tracking-[0.2em] text-emerald-300/70">GAME STUDIO</p>
            </div>
          ) : null}
        </div>

        <nav className="space-y-5">
          {groups.map((group) => {
            const items = navItems.filter((item) => item.group === group);
            return (
              <div key={group} className="space-y-1">
                {!compact ? (
                  <p className="px-3 pb-1 text-[9px] font-black uppercase tracking-[0.18em] text-text-muted/80">
                    {group}
                  </p>
                ) : null}
                {items.map(({ to, icon: Icon, labelKey, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={compact ? label ?? t(labelKey!) : undefined}
                    className={({ isActive }) =>
                      `no-drag group relative flex items-center rounded-xl transition-all duration-200 ${
                        compact ? "h-11 justify-center" : "gap-3 px-3 py-2.5"
                      } ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-400/15 via-emerald-400/[0.08] to-transparent text-white"
                          : "text-text-secondary hover:bg-white/[0.045] hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" /> : null}
                        <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-emerald-300" : "text-text-muted group-hover:text-text-secondary"}`} />
                        {!compact ? <span className="truncate text-[13px] font-semibold">{label ?? t(labelKey!)}</span> : null}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </div>

      <div className={`mt-auto ${compact ? "p-3" : "p-4"}`}>
        <div className={`rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.045] ${compact ? "grid h-12 place-items-center" : "p-3"}`}>
          {compact ? <Sparkles className="h-4 w-4 text-emerald-300" /> : <><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_9px_#6ee7b7]" /> Client ready</div><p className="mt-1.5 text-[11px] leading-4 text-text-muted">Your profiles and settings are synced locally.</p></>}
        </div>
      </div>
    </aside>
  );
}
