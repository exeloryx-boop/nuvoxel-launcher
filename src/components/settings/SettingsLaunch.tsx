import { Coffee, FolderOpen, Gauge, Monitor, Shield, SlidersHorizontal, Zap } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { SettingCard } from "../ui/SettingCard";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { Slider } from "../ui/Slider";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { LOW_END_MEMORY_MARKS, MEMORY_MARKS, type Resolution } from "../../types";

export function SettingsLaunch() {
  const memoryMb = useAppStore((s) => s.memoryMb);
  const devMode = useAppStore((s) => s.devMode);
  const lowEndMode = useAppStore((s) => s.lowEndMode);
  const resolution = useAppStore((s) => s.resolution);
  const gameDirectory = useAppStore((s) => s.gameDirectory);
  const integrityCheck = useAppStore((s) => s.integrityCheck);
  const executablePath = useAppStore((s) => s.executablePath);
  const jvmParams = useAppStore((s) => s.jvmParams);
  const setMemoryMb = useAppStore((s) => s.setMemoryMb);
  const setResolution = useAppStore((s) => s.setResolution);
  const setGameDirectory = useAppStore((s) => s.setGameDirectory);
  const setIntegrityCheck = useAppStore((s) => s.setIntegrityCheck);
  const setExecutablePath = useAppStore((s) => s.setExecutablePath);
  const setJvmParams = useAppStore((s) => s.setJvmParams);
  const setLowEndMode = useAppStore((s) => s.setLowEndMode);

  const memoryMarks = lowEndMode ? LOW_END_MEMORY_MARKS : MEMORY_MARKS;
  const memoryMin = lowEndMode ? 1024 : 2048;
  const memoryMax = lowEndMode ? 4096 : 24576;

  const pickGameDir = async () => {
    try {
      const path = await invoke<string | null>("pick_folder");
      if (path) setGameDirectory(path);
    } catch {
      /* desktop only */
    }
  };

  const pickJava = async () => {
    try {
      const path = await invoke<string | null>("pick_java_executable");
      if (path) setExecutablePath(path);
    } catch {
      /* desktop only */
    }
  };

  const resolutions: { id: Resolution; label: string }[] = [
    { id: "fullscreen", label: t("fullscreen") },
    { id: "maximized", label: t("maximized") },
    { id: "windowed", label: t("windowed") },
  ];

  return (
    <>
      <SettingCard
        icon={<Gauge className="h-5 w-5" />}
        title={t("lowEndMode")}
        description={t("lowEndModeDesc")}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">{t("lowEndModeHint")}</p>
          <ToggleSwitch checked={lowEndMode} onChange={setLowEndMode} />
        </div>
      </SettingCard>

      <SettingCard
        icon={<Zap className="h-5 w-5" />}
        title={t("memoryAllocation")}
        description={t("memoryAllocationDesc")}
      >
        <div className="mb-4 flex items-center gap-2">
          <input
            type="number"
            value={memoryMb}
            min={memoryMin}
            max={memoryMax}
            onChange={(e) => setMemoryMb(Number(e.target.value))}
            className="no-drag w-24 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none"
          />
          <span className="text-sm text-text-muted">{t("mb")}</span>
        </div>
        <Slider
          min={memoryMin}
          max={memoryMax}
          step={256}
          value={memoryMb}
          onChange={setMemoryMb}
          marks={memoryMarks.map((m) => ({
            value: m.mb,
            label: t("memoryGbMark", { n: m.gb }),
          }))}
        />
      </SettingCard>

      <SettingCard
        icon={<Monitor className="h-5 w-5" />}
        title={t("gameResolution")}
        description={t("gameResolutionDesc")}
      >
        <div className="grid grid-cols-3 gap-3">
          {resolutions.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setResolution(r.id)}
              className={`no-drag rounded-xl border-2 p-3 text-center transition ${
                resolution === r.id
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-border hover:border-white/20"
              }`}
            >
              <div className="mx-auto mb-2 h-12 w-16 rounded border border-white/20 bg-bg-elevated" />
              <div className="flex items-center justify-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full border-2 ${
                    resolution === r.id
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-white/30"
                  }`}
                />
                <span className="text-xs">{r.label}</span>
              </div>
            </button>
          ))}
        </div>
      </SettingCard>

      <SettingCard
        icon={<FolderOpen className="h-5 w-5" />}
        title={t("gameDirectory")}
        description={t("gameDirectoryDesc")}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={gameDirectory}
            onChange={(e) => setGameDirectory(e.target.value)}
            className="no-drag min-w-0 flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none"
          />
          <button
            type="button"
            onClick={() => void pickGameDir()}
            className="no-drag flex shrink-0 items-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm transition hover:bg-white/5"
          >
            <FolderOpen className="h-4 w-4" />
            {t("select")}
          </button>
        </div>
      </SettingCard>

      <SettingCard
        icon={<Coffee className="h-5 w-5" />}
        title={t("executablePath")}
        description={t("executablePathDesc")}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={executablePath}
            onChange={(e) => setExecutablePath(e.target.value)}
            placeholder={t("useDefaultPath")}
            className="no-drag min-w-0 flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={() => void pickJava()}
            className="no-drag flex shrink-0 items-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm transition hover:bg-white/5"
          >
            <FolderOpen className="h-4 w-4" />
            {t("select")}
          </button>
        </div>
        <p className="mt-2 text-xs text-text-muted">{t("javaPathSettingsHint")}</p>
      </SettingCard>

      {devMode ? (
        <>
      <SettingCard
        icon={<Shield className="h-5 w-5" />}
        title={t("integrityCheck")}
        description={t("integrityCheckDesc")}
        badge={t("forDevelopers")}
      >
        <div className="mb-4 rounded-lg border border-border bg-bg-elevated p-3 text-sm text-text-secondary">
          <Zap className="mb-1 inline h-4 w-4 text-[var(--accent)]" />{" "}
          {t("integrityWarning")}
        </div>
        <div className="flex items-center gap-3">
          <ToggleSwitch checked={integrityCheck} onChange={setIntegrityCheck} />
          <span className="text-sm">{t("integrityToggle")}</span>
        </div>
      </SettingCard>

      <SettingCard
        icon={<SlidersHorizontal className="h-5 w-5" />}
        title={t("jvmParams")}
        description={t("jvmParamsDesc")}
        badge={t("forDevelopers")}
      >
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {t("executableWarning")}
        </div>
        <input
          type="text"
          value={jvmParams}
          onChange={(e) => setJvmParams(e.target.value)}
          placeholder={t("useDefaultJvm")}
          className="no-drag w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
      </SettingCard>
        </>
      ) : null}
    </>
  );
}
