import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";

export interface SystemInfo {
  ramGb: number | null;
  cpuCores: number;
  isLowEnd: boolean;
  suggestedMemoryMb: number;
}

function detectSystemInfo(): SystemInfo {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const ramGb = nav.deviceMemory ?? null;
  const cpuCores = navigator.hardwareConcurrency || 4;

  // Heuristic: low-end if ≤4GB RAM or ≤2 CPU cores
  const isLowEnd =
    (ramGb !== null && ramGb <= 4) || cpuCores <= 2;

  let suggestedMemoryMb = 4096;
  if (ramGb !== null) {
    if (ramGb <= 2) suggestedMemoryMb = 1024;
    else if (ramGb <= 4) suggestedMemoryMb = 2048;
    else if (ramGb <= 8) suggestedMemoryMb = 4096;
    else if (ramGb <= 16) suggestedMemoryMb = 8192;
    else suggestedMemoryMb = 12288;
  }

  return { ramGb, cpuCores, isLowEnd, suggestedMemoryMb };
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function buildSystemInfo(ramGb: number | null, cpuCores: number): SystemInfo {
  const isLowEnd = (ramGb !== null && ramGb <= 4) || cpuCores <= 2;
  let suggestedMemoryMb = 4096;
  if (ramGb !== null) {
    if (ramGb <= 2) suggestedMemoryMb = 1024;
    else if (ramGb <= 4) suggestedMemoryMb = 2048;
    else if (ramGb <= 8) suggestedMemoryMb = 4096;
    else if (ramGb <= 16) suggestedMemoryMb = 8192;
    else suggestedMemoryMb = 12288;
  }
  return { ramGb, cpuCores, isLowEnd, suggestedMemoryMb };
}

/**
 * On first launch, detect system specs and suggest low-end mode
 * if the system appears to be weak. Only suggests once.
 */
export function useSystemDetection() {
  const lowEndMode = useAppStore((s) => s.lowEndMode);
  const setLowEndMode = useAppStore((s) => s.setLowEndMode);
  const setMemoryMb = useAppStore((s) => s.setMemoryMb);
  const totalLaunches = useAppStore((s) => s.achievementStats.totalLaunches);
  const [suggested, setSuggested] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      let info = detectSystemInfo();
      if (isTauri()) {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          const native = await invoke<{ ramMb?: number; cpuCores?: number }>(
            "system_info",
          );
          const ramGb = native.ramMb ? native.ramMb / 1024 : info.ramGb;
          info = buildSystemInfo(ramGb, native.cpuCores || info.cpuCores);
        } catch {
          // WebView APIs are an adequate fallback when the native check fails.
        }
      }
      if (cancelled) return;
      setSystemInfo(info);

      // Only suggest on first ever use (no launches yet)
      const alreadySuggested = localStorage.getItem("nuvolexlauncher-system-detected");
      if (alreadySuggested) {
        setDismissed(true);
        return;
      }

      if (info.isLowEnd && !lowEndMode && totalLaunches === 0) {
        setSuggested(true);
      }
    };
    void detect();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const acceptSuggestion = () => {
    if (!systemInfo) return;
    setLowEndMode(true);
    setMemoryMb(systemInfo.suggestedMemoryMb);
    setSuggested(false);
    setDismissed(true);
    localStorage.setItem("nuvolexlauncher-system-detected", "1");
  };

  const dismissSuggestion = () => {
    setSuggested(false);
    setDismissed(true);
    localStorage.setItem("nuvolexlauncher-system-detected", "1");
  };

  return {
    systemInfo,
    showSuggestion: suggested && !dismissed,
    acceptSuggestion,
    dismissSuggestion,
  };
}

export function getSystemInfo(): SystemInfo {
  return detectSystemInfo();
}
