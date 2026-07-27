import { useEffect, useState } from "react";
import { Coffee, ExternalLink, FolderOpen, Play, RefreshCw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Modal } from "../ui/Modal";
import { t } from "../../i18n";
import { translateLaunchError } from "../../i18n/launchProgress";
import { useAppStore, useActiveModPack } from "../../store/useAppStore";
import { detectJava } from "../../services/minecraftLaunch";

export function JavaPathModal() {
  const open = useAppStore((s) => s.showJavaPathModal);
  const error = useAppStore((s) => s.javaPathModalError);
  const retryPackId = useAppStore((s) => s.javaPathRetryPackId);
  const setOpen = useAppStore((s) => s.setShowJavaPathModal);
  const executablePath = useAppStore((s) => s.executablePath);
  const setExecutablePath = useAppStore((s) => s.setExecutablePath);
  const play = useAppStore((s) => s.play);
  const minecraftVersion = useAppStore((s) => s.minecraftVersion);
  const activePack = useActiveModPack();

  const mcVersion = activePack?.minecraftVersion ?? minecraftVersion;
  const [draft, setDraft] = useState(executablePath);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(executablePath);
      setDetected(null);
      setDetectError(null);
    }
  }, [open, executablePath]);

  const runDetect = async (custom?: string) => {
    setDetecting(true);
    setDetectError(null);
    try {
      const path = await detectJava(custom, mcVersion);
      setDetected(path);
      if (!custom) setDraft(path);
    } catch (e) {
      setDetected(null);
      setDetectError(e instanceof Error ? e.message : String(e));
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (!open || executablePath) return;
    let cancelled = false;
    (async () => {
      setDetecting(true);
      setDetectError(null);
      try {
        const path = await detectJava(undefined, mcVersion);
        if (cancelled) return;
        setDetected(path);
        setDraft(path);
      } catch (e) {
        if (cancelled) return;
        setDetected(null);
        setDetectError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setDetecting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, executablePath, mcVersion]);

  const pickJava = async () => {
    try {
      const path = await invoke<string | null>("pick_java_executable");
      if (path) {
        setDraft(path);
        await runDetect(path);
      }
    } catch {
      /* desktop only */
    }
  };

  const saveAndRetry = () => {
    setExecutablePath(draft.trim());
    setOpen(false);
    void play(retryPackId ?? undefined);
  };

  const useAuto = () => {
    setDraft("");
    setExecutablePath("");
    setDetected(null);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title={t("javaPathModalTitle")} size="md">
      <div className="space-y-4 p-6">
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <Coffee className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <p className="text-sm text-text-primary">{t("javaPathModalDesc")}</p>
            {error ? (
              <p className="mt-2 text-sm text-amber-200/90">{translateLaunchError(error)}</p>
            ) : null}
            <p className="mt-2 text-xs text-text-muted">
              {t("javaPathRequiredHint").replace("{version}", mcVersion)}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("executablePath")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("useDefaultPath")}
              className="no-drag min-w-0 flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-[var(--accent)]"
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={detecting}
            onClick={() => void runDetect(draft.trim() || undefined)}
            className="no-drag flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${detecting ? "animate-spin-slow" : ""}`} />
            {t("javaPathAutoDetect")}
          </button>
          {draft ? (
            <button
              type="button"
              onClick={useAuto}
              className="no-drag rounded-lg border border-border px-3 py-2 text-sm text-text-muted transition hover:bg-white/5"
            >
              {t("javaPathClear")}
            </button>
          ) : null}
        </div>

        {detected ? (
          <p className="text-xs text-green-400">
            {t("javaPathDetected")}: <span className="font-mono">{detected}</span>
          </p>
        ) : detectError ? (
          <p className="text-xs text-red-400">{translateLaunchError(detectError)}</p>
        ) : detecting ? (
          <p className="text-xs text-text-muted">{t("javaPathDetecting")}</p>
        ) : null}

        <a
          href="https://adoptium.net/"
          target="_blank"
          rel="noreferrer"
          className="no-drag inline-flex items-center gap-2 text-sm text-[var(--accent)] transition hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          {t("javaPathDownloadHint")}
        </a>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="no-drag rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition hover:bg-white/5"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={saveAndRetry}
            className="no-drag btn-glow flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
          >
            <Play className="h-4 w-4 fill-current" />
            {t("javaPathSaveRetry")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
