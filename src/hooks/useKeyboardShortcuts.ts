import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { openPackFolder } from "../services/modInstall";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function useKeyboardShortcuts() {
  const enabled = useAppStore((s) => s.keyboardShortcuts);
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;
      const state = useAppStore.getState();

      if (e.key === "F5") {
        e.preventDefault();
        if (!state.isPlaying && !state.gameRunning) void state.play();
        return;
      }

      if (mod && e.key === "Enter") {
        e.preventDefault();
        if (!state.isPlaying && !state.gameRunning) void state.play();
        return;
      }

      if (mod && !e.shiftKey && e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const routes = ["/", "/mods", "/servers", "/accounts", "/settings"] as const;
        navigate(routes[Number(e.key) - 1] ?? "/");
        return;
      }

      if (mod && e.key.toLowerCase() === "o") {
        e.preventDefault();
        void openPackFolder(state.gameDirectory);
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        state.setShowVersionPicker(true);
        return;
      }

      if (mod && e.key === ",") {
        e.preventDefault();
        state.setSettingsSection("general");
        navigate("/settings");
        return;
      }

      if (e.key === "Escape") {
        if (state.showVersionPicker) state.setShowVersionPicker(false);
        else if (state.showAccountSwitcher) state.setShowAccountSwitcher(false);
        else if (state.showAddAccountModal) state.setShowAddAccountModal(false);
        else if (state.showCreatePackModal) state.setShowCreatePackModal(false);
        else if (state.showNuvoxelLogin) state.setShowNuvoxelLogin(false);
        else if (state.showAddFriendModal) state.setShowAddFriendModal(false);
        else if (state.showJavaPathModal) state.setShowJavaPathModal(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, navigate]);
}
