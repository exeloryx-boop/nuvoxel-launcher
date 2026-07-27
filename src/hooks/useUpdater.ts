import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  notes: string;
  pubDate: string;
}

import { APP_VERSION, AUTO_UPDATES_ENABLED } from "@shared/version";

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function parseVersion(v: string): number[] {
  return v.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
}

export function isNewerVersion(remote: string, local = APP_VERSION): boolean {
  const a = parseVersion(remote);
  const b = parseVersion(local);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

function updateBaseUrl(): string {
  const fromStore = useAppStore.getState().socialApiUrl?.trim();
  if (fromStore) return fromStore.replace(/\/$/, "");
  return "http://127.0.0.1:3847";
}

export function useUpdater() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const markUpdatedOnReleaseDay = useAppStore((s) => s.markUpdatedOnReleaseDay);

  const check = useCallback(async (): Promise<boolean> => {
    if (!isTauri()) return false;
    setChecking(true);
    try {
      const res = await fetch(`${updateBaseUrl()}/updates/latest`);
      if (!res.ok) return false;
      const data = (await res.json()) as UpdateInfo;
      if (isNewerVersion(data.version)) {
        setUpdate(data);
        setDismissed(false);
        return true;
      }
      setUpdate(null);
      return false;
    } catch {
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  const install = useCallback(async () => {
    if (!update || !isTauri()) return;
    setInstalling(true);
    try {
      await invoke("install_launcher_update", { downloadUrl: update.downloadUrl });
      markUpdatedOnReleaseDay();
    } catch {
      useAppStore.getState().showToast("updateInstallError");
      setTimeout(() => useAppStore.getState().clearToast(), 3000);
    } finally {
      setInstalling(false);
    }
  }, [update, markUpdatedOnReleaseDay]);

  useEffect(() => {
    if (!AUTO_UPDATES_ENABLED) return;
    void check();
    const id = setInterval(() => void check(), CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [check]);

  return {
    update,
    checking,
    installing,
    dismissed,
    dismiss: () => setDismissed(true),
    check,
    install,
    currentVersion: APP_VERSION,
  };
}

export { APP_VERSION };
