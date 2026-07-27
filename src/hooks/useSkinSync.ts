import { useEffect } from "react";
import {
  loadSelectedSkin,
  SKIN_STORAGE_KEY,
  SKIN_CHANGE_EVENT,
  type SelectedSkin,
} from "@shared/skins";
import { useAppStore } from "../store/useAppStore";

export function useSkinSync() {
  useEffect(() => {
    const stored = loadSelectedSkin();
    // Do not call setSelectedSkin here: it persists and emits SKIN_CHANGE_EVENT,
    // which used to make this listener re-emit the same event indefinitely.
    if (stored) useAppStore.setState({ selectedSkin: stored });

    const onSkinChange = (e: Event) => {
      const detail = (e as CustomEvent<SelectedSkin>).detail;
      if (detail) useAppStore.setState({ selectedSkin: detail });
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === SKIN_STORAGE_KEY) {
        const skin = loadSelectedSkin();
        useAppStore.setState({ selectedSkin: skin });
      }
    };

    window.addEventListener(SKIN_CHANGE_EVENT, onSkinChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SKIN_CHANGE_EVENT, onSkinChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
}
