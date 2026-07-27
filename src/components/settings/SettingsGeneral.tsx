import {
  Brackets,
  Globe,
  Keyboard,
  List,
  Monitor,
  Sparkles,
  User,
  Volume2,
} from "lucide-react";
import { SettingCard } from "../ui/SettingCard";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { getLanguageLabel } from "../../i18n";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppStore } from "../../store/useAppStore";
import { playRetroSound } from "../../utils/sound";
import type { LauncherBehavior } from "../../types/achievements";

function detectSystemLanguage(): string {
  if (typeof navigator === "undefined") return "ru";
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("uk")) return "uk";
  if (lang.startsWith("en")) return "en";
  if (lang.startsWith("ru")) return "ru";
  return "ru";
}

export function SettingsGeneral() {
  const { t, language } = useTranslation();
  const showSkins = useAppStore((s) => s.showSkins);
  const logging = useAppStore((s) => s.logging);
  const devMode = useAppStore((s) => s.devMode);
  const launcherBehavior = useAppStore((s) => s.launcherBehavior);
  const confirmBeforeLaunch = useAppStore((s) => s.confirmBeforeLaunch);
  const quickLaunchDoubleClick = useAppStore((s) => s.quickLaunchDoubleClick);
  const compactLists = useAppStore((s) => s.compactLists);
  const copyVersionOnClick = useAppStore((s) => s.copyVersionOnClick);
  const keyboardShortcuts = useAppStore((s) => s.keyboardShortcuts);
  const retroSoundsEnabled = useAppStore((s) => s.retroSoundsEnabled);
  const setShowSkins = useAppStore((s) => s.setShowSkins);
  const setLogging = useAppStore((s) => s.setLogging);
  const setDevMode = useAppStore((s) => s.setDevMode);
  const setLauncherBehavior = useAppStore((s) => s.setLauncherBehavior);
  const setConfirmBeforeLaunch = useAppStore((s) => s.setConfirmBeforeLaunch);
  const setQuickLaunchDoubleClick = useAppStore((s) => s.setQuickLaunchDoubleClick);
  const setCompactLists = useAppStore((s) => s.setCompactLists);
  const setCopyVersionOnClick = useAppStore((s) => s.setCopyVersionOnClick);
  const setKeyboardShortcuts = useAppStore((s) => s.setKeyboardShortcuts);
  const setRetroSoundsEnabled = useAppStore((s) => s.setRetroSoundsEnabled);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const systemLang = detectSystemLanguage();
  const systemLabel =
    systemLang === "uk"
      ? t("ukrainian")
      : systemLang === "en"
        ? t("english")
        : t("russian");

  return (
    <>
      <SettingCard
        icon={<Globe className="h-5 w-5" />}
        title={t("language")}
        description={t("languageDescAuto")}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <select
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value as "ru" | "uk" | "en")
            }
            className="no-drag w-full max-w-lg rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-[var(--accent)]"
          >
            <option value="ru">🇷🇺 {t("russian")}</option>
            <option value="uk">🇺🇦 {t("ukrainian")}</option>
            <option value="en">🇬🇧 {t("english")}</option>
          </select>
          <span className="text-sm text-text-muted">
            {t("systemLanguageLabel", { lang: systemLabel })}
          </span>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {t("selectedLanguage", { lang: getLanguageLabel(language as "ru" | "uk" | "en") })}
        </p>
      </SettingCard>

      <SettingCard
        icon={<Monitor className="h-5 w-5" />}
        title={t("afterLaunch")}
        description={t("afterLaunchDesc")}
      >
        <select
          value={launcherBehavior}
          onChange={(e) =>
            setLauncherBehavior(e.target.value as LauncherBehavior)
          }
          className="no-drag w-full max-w-lg rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-[var(--accent)]"
        >
          <option value="keepOpen">{t("keepOpen")}</option>
          <option value="minimize">{t("minimizeOnLaunch")}</option>
          <option value="hide">{t("hideOnLaunch")}</option>
        </select>
      </SettingCard>

      <SettingCard
        icon={<Sparkles className="h-5 w-5" />}
        title={t("convenienceSettings")}
        description={t("convenienceSettingsDesc")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ConvenienceToggle
            label={t("confirmBeforeLaunch")}
            hint={t("confirmBeforeLaunchDesc")}
            checked={confirmBeforeLaunch}
            onChange={setConfirmBeforeLaunch}
          />
          <ConvenienceToggle
            label={t("quickLaunchDoubleClick")}
            hint={t("quickLaunchDoubleClickDesc")}
            checked={quickLaunchDoubleClick}
            onChange={setQuickLaunchDoubleClick}
          />
          <ConvenienceToggle
            label={t("compactLists")}
            hint={t("compactListsDesc")}
            checked={compactLists}
            onChange={setCompactLists}
          />
          <ConvenienceToggle
            label={t("copyVersionOnClick")}
            hint={t("copyVersionOnClickDesc")}
            checked={copyVersionOnClick}
            onChange={setCopyVersionOnClick}
          />
          <ConvenienceToggle
            label={t("retroSoundsSetting")}
            hint={t("retroSoundsSettingDesc")}
            checked={retroSoundsEnabled}
            onChange={setRetroSoundsEnabled}
          />
        </div>
        {retroSoundsEnabled && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => playRetroSound("success")}
              className="no-drag flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-text-secondary transition hover:bg-white/10 hover:text-text-primary"
            >
              <Volume2 className="h-3.5 w-3.5" />
              {language === "uk" ? "Тест звуку" : language === "ru" ? "Тест звука" : "Test sound"}
            </button>
            <button
              type="button"
              onClick={() => playRetroSound("achievement")}
              className="no-drag flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-text-secondary transition hover:bg-white/10 hover:text-text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {language === "uk" ? "Фанфари" : language === "ru" ? "Фанфары" : "Fanfare"}
            </button>
          </div>
        )}
      </SettingCard>

      <SettingCard
        icon={<Keyboard className="h-5 w-5" />}
        title={t("keyboardShortcuts")}
        description={t("keyboardShortcutsSettingDesc")}
      >
        <div className="mb-4 flex justify-end">
          <ToggleSwitch checked={keyboardShortcuts} onChange={setKeyboardShortcuts} />
        </div>
        <ShortcutsTable />
      </SettingCard>

      <SettingCard
        icon={<User className="h-5 w-5" />}
        title={t("showSkins")}
        description={t("showSkinsDesc")}
      >
        <div className="flex justify-end">
          <ToggleSwitch checked={showSkins} onChange={setShowSkins} />
        </div>
      </SettingCard>

      <SettingCard
        icon={<List className="h-5 w-5" />}
        title={t("logging")}
        description={t("loggingDesc")}
        badge={t("forDevelopers")}
      >
        <div className="flex justify-end">
          <ToggleSwitch checked={logging} onChange={setLogging} />
        </div>
        {logging ? (
          <p className="mt-3 text-xs text-amber-400/90">{t("loggingActiveNote")}</p>
        ) : null}
      </SettingCard>

      <SettingCard
        icon={<Brackets className="h-5 w-5" />}
        title={t("devMode")}
        description={t("devModeDesc")}
      >
        <div className="flex justify-end">
          <ToggleSwitch checked={devMode} onChange={setDevMode} />
        </div>
      </SettingCard>
    </>
  );
}

function ShortcutsTable() {
  const { t } = useTranslation();
  const rows: { keys: string; action: string }[] = [
    { keys: "Ctrl + Enter / F5", action: t("shortcutPlay") },
    { keys: "Ctrl + 1", action: t("shortcutNavHome") },
    { keys: "Ctrl + 2", action: t("shortcutNavMods") },
    { keys: "Ctrl + 3", action: t("shortcutNavServers") },
    { keys: "Ctrl + 4", action: t("shortcutNavAccounts") },
    { keys: "Ctrl + 5", action: t("shortcutNavSettings") },
    { keys: "Ctrl + O", action: t("shortcutOpenFolder") },
    { keys: "Ctrl + Shift + V", action: t("shortcutVersionPicker") },
    { keys: "Ctrl + ,", action: t("shortcutSettings") },
    { keys: "Esc", action: t("shortcutClose") },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <p className="border-b border-border bg-bg-elevated/60 px-4 py-2 text-xs font-medium text-text-muted">
        {t("shortcutsReference")}
      </p>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.keys}
            className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <kbd className="w-fit rounded-md border border-border bg-bg-elevated px-2 py-1 font-mono text-xs text-[var(--accent)]">
              {row.keys}
            </kbd>
            <span className="text-sm text-text-secondary">{row.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConvenienceToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated/50 px-4 py-3">
      <div className="min-w-0">
        <span className="text-sm text-text-secondary">{label}</span>
        <p className="text-xs text-text-muted">{hint}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </label>
  );
}
