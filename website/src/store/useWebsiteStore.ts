import { create } from "zustand";
import {
  clearWebAuth,
  loadSelectedSkin,
  loadWebAuth,
  saveSelectedSkin,
  saveWebAuth,
  type SelectedSkin,
  type WebAuthSession,
} from "@shared/skins";

interface WebsiteState {
  auth: WebAuthSession | null;
  selectedSkin: SelectedSkin | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setSelectedSkin: (skin: SelectedSkin) => void;
  hydrate: () => void;
}

export const useWebsiteStore = create<WebsiteState>((set) => ({
  auth: loadWebAuth(),
  selectedSkin: loadSelectedSkin(),

  hydrate: () => {
    set({ auth: loadWebAuth(), selectedSkin: loadSelectedSkin() });
  },

  login: async (email, password) => {
    await new Promise((r) => setTimeout(r, 700));
    const username = email.includes("@")
      ? email.split("@")[0]
      : email.trim() || "Player";
    const session: WebAuthSession = {
      email: email.trim(),
      username,
      loggedIn: true,
    };
    saveWebAuth(session);
    set({ auth: session });
    void password;
  },

  logout: () => {
    clearWebAuth();
    set({ auth: null });
  },

  setSelectedSkin: (skin) => {
    saveSelectedSkin(skin);
    set({ selectedSkin: skin });
  },
}));
