import { useEffect } from "react";
import { restoreLauncherWindow } from "../store/achievementSync";
import { useAppStore } from "../store/useAppStore";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function useGameSession() {
  const setGameRunning = useAppStore((s) => s.setGameRunning);

  useEffect(() => {
    if (!isTauri()) return;

    let unlisten: (() => void) | undefined;

    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      unlisten = await listen("game-exited", () => {
        setGameRunning(false);
        void restoreLauncherWindow(useAppStore.getState().launcherBehavior);
      });
    })();

    return () => {
      unlisten?.();
    };
  }, [setGameRunning]);

  useEffect(() => {
    if (!isTauri()) return;

    void (async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      const defaultDir = await invoke<string>("default_minecraft_dir");
      const current = useAppStore.getState().gameDirectory;
      const staleDefaults = [
        "C:\\Users\\User\\AppData\\Roaming\\.minecraft",
        ".minecraft",
      ];
      if (!current || staleDefaults.includes(current)) {
        useAppStore.getState().setGameDirectory(defaultDir);
      }
    })();
  }, []);
}
