import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Info,
  Palette,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import type { SettingsSection } from "../../types";

const sections: {
  id: SettingsSection;
  labelKey: keyof typeof import("../../i18n/ru").ru;
  icon: typeof Settings2;
}[] = [
  { id: "general", labelKey: "settingsGeneral", icon: Settings2 },
  { id: "appearance", labelKey: "settingsAppearance", icon: Palette },
  { id: "launch", labelKey: "settingsLaunch", icon: SlidersHorizontal },
  { id: "connections", labelKey: "settingsConnections", icon: Globe },
  { id: "about", labelKey: "settingsAbout", icon: Info },
];

interface SettingsLayoutProps {
  children: ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const navigate = useNavigate();
  const section = useAppStore((s) => s.settingsSection);
  const setSection = useAppStore((s) => s.setSettingsSection);

  const current = sections.find((s) => s.id === section)!;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-bg-primary/95 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-sm">
          <Settings2 className="h-4 w-4 text-text-muted" />
          <span className="text-text-muted">{t("settings")} /</span>
          <current.icon className="h-4 w-4 text-[var(--accent)]" />
          <span className="font-semibold text-text-primary">
            {t(current.labelKey)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="no-drag flex flex-col items-center gap-0.5 rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
        >
          <X className="h-5 w-5" />
          <span className="text-[10px] uppercase tracking-wider">{t("esc")}</span>
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-64 shrink-0 border-r border-border px-4 py-5">
          <nav className="flex flex-col gap-1">
            {sections.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`no-drag flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  section === id
                    ? "bg-white/10 font-medium text-text-primary"
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(labelKey)}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
          <div className="w-full space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
