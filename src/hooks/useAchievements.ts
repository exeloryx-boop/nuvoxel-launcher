import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { recordDailyLogin, syncAchievements, trackNavTab } from "../store/achievementSync";

export function useAchievements() {
  const location = useLocation();
  const gameRunning = useAppStore((s) => s.gameRunning);

  useEffect(() => {
    trackNavTab(useAppStore.getState, useAppStore.setState, location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    recordDailyLogin(useAppStore.getState, useAppStore.setState);
  }, []);

  useEffect(() => {
    if (!gameRunning) return;
    const start = Date.now();
    syncAchievements(useAppStore.getState, useAppStore.setState, (s) => ({
      ...s,
      gameSessionStart: start,
    }));
    return () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      if (elapsed <= 0) return;
      syncAchievements(useAppStore.getState, useAppStore.setState, (s) => ({
        ...s,
        playTimeSeconds: s.playTimeSeconds + elapsed,
        gameSessionStart: null,
      }));
    };
  }, [gameRunning]);
}
