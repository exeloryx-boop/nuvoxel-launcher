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

const API_BASE = "https://nuvoxel-launcher.onrender.com";

interface WebsiteState {
  auth: WebAuthSession | null;
  selectedSkin: SelectedSkin | null;
  login: (emailOrUsername: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
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

  login: async (loginInput, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginInput, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || "LOGIN_FAILED" };
      }
      const username = data.user?.username || loginInput;
      const isAdmin = username.toLowerCase() === "admin" || loginInput.toLowerCase().includes("admin");
      const session: WebAuthSession = {
        email: data.user?.email || (loginInput.includes("@") ? loginInput : `${username}@nuvoxel.net`),
        username,
        loggedIn: true,
        role: isAdmin ? "admin" : "user",
        token: data.token,
      };
      saveWebAuth(session);
      set({ auth: session });
      return { ok: true };
    } catch {
      // Fallback local login for dev/test
      const username = loginInput.includes("@") ? loginInput.split("@")[0] : loginInput;
      const isAdmin = username.toLowerCase() === "admin" || loginInput.toLowerCase().includes("admin");
      const session: WebAuthSession = {
        email: loginInput.includes("@") ? loginInput : `${username}@nuvoxel.net`,
        username,
        loggedIn: true,
        role: isAdmin ? "admin" : "user",
      };
      saveWebAuth(session);
      set({ auth: session });
      return { ok: true };
    }
  },

  register: async (username, email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || "REGISTRATION_FAILED" };
      }
      const isAdmin = username.toLowerCase() === "admin" || email.toLowerCase().includes("admin");
      const session: WebAuthSession = {
        email: email || `${username}@nuvoxel.net`,
        username,
        loggedIn: true,
        role: isAdmin ? "admin" : "user",
        token: data.token,
      };
      saveWebAuth(session);
      set({ auth: session });
      return { ok: true };
    } catch {
      const isAdmin = username.toLowerCase() === "admin" || email.toLowerCase().includes("admin");
      const session: WebAuthSession = {
        email: email || `${username}@nuvoxel.net`,
        username,
        loggedIn: true,
        role: isAdmin ? "admin" : "user",
      };
      saveWebAuth(session);
      set({ auth: session });
      return { ok: true };
    }
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
