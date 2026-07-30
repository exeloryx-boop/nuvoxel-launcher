export interface SkinItem {
  id: string;
  name: string;
  username: string;
  category: SkinCategory;
  tags?: string[];
}

export type SkinCategory =
  | "popular"
  | "boys"
  | "girls"
  | "anime"
  | "animals"
  | "fashion"
  | "games"
  | "movies"
  | "pvp"
  | "medieval"
  | "horror"
  | "superheroes"
  | "memes";

export type SkinModel = "classic" | "slim";

export const NO_CAPE_ID = "none";

export interface CapeItem {
  id: string;
  nameKey: string;
  textureUsername: string;
}

export interface SelectedSkin {
  id: string;
  name: string;
  username: string;
  model?: SkinModel;
  capeId?: string | null;
  /** A locally uploaded PNG skin, stored as a data URL. */
  customSkinData?: string | null;
  /** A locally uploaded PNG cape, stored as a data URL. */
  customCapeData?: string | null;
}

export interface WebAuthSession {
  email: string;
  username: string;
  friendCode?: string;
  loggedIn: boolean;
  role?: "admin" | "user";
  token?: string;
}

import {
  LEGACY_AUTH,
  LEGACY_NUVOXEL_AUTH,
  LEGACY_NUVOXEL_SKIN,
  LEGACY_SKIN,
} from "./legacyStorageKeys";

export const SKIN_STORAGE_KEY = "nuvolexlauncher-selected-skin";
export const AUTH_STORAGE_KEY = "nuvolexlauncher-web-auth";
export const SKIN_CHANGE_EVENT = "nuvolexlauncher-skin-change";
export const AUTH_CHANGE_EVENT = "nuvolexlauncher-auth-change";

export const SKIN_CATEGORIES: { id: SkinCategory; label: string }[] = [
  { id: "popular", label: "Популярно" },
  { id: "boys", label: "Парням" },
  { id: "girls", label: "Девушкам" },
  { id: "anime", label: "Аниме" },
  { id: "games", label: "Игры" },
  { id: "movies", label: "Кино" },
  { id: "superheroes", label: "Супергерои" },
  { id: "pvp", label: "PvP" },
  { id: "medieval", label: "Средневековье" },
  { id: "fashion", label: "Модные" },
  { id: "animals", label: "Животные" },
  { id: "horror", label: "Хоррор" },
  { id: "memes", label: "Мемы" },
];

export { SKIN_CATALOG_BASE } from "./skin-catalog";
export { SKIN_CATALOG_GENERATED } from "./skin-catalog-generated";

import { SKIN_CATALOG_BASE } from "./skin-catalog";
import { SKIN_CATALOG_GENERATED } from "./skin-catalog-generated";

export const SKIN_CATALOG = [...SKIN_CATALOG_BASE, ...SKIN_CATALOG_GENERATED];

export const CAPE_CATALOG: CapeItem[] = [
  { id: NO_CAPE_ID, nameKey: "capeNone", textureUsername: "" },
  { id: "mojang", nameKey: "capeNameMojang", textureUsername: "Notch" },
  { id: "mojang_jeb", nameKey: "capeNameMojangStaff", textureUsername: "jeb_" },
  { id: "mojang_dinner", nameKey: "capeNameMojangStaff", textureUsername: "Dinnerbone" },
  { id: "vanilla", nameKey: "capeNameVanilla", textureUsername: "LadyAgnes" },
  { id: "translator", nameKey: "capeNameTranslator", textureUsername: "0154" },
  { id: "scroll", nameKey: "capeNameScroll", textureUsername: "Grumm" },
  { id: "prismarine", nameKey: "capeNamePrismarine", textureUsername: "Cyprezz" },
  { id: "birthday", nameKey: "capeNameBirthday", textureUsername: "Minecraft" },
  { id: "migrator", nameKey: "capeNameMigrator", textureUsername: "Kingbdogz" },
  { id: "cherry", nameKey: "capeNameCherry", textureUsername: "HelenAngel" },
  { id: "purple", nameKey: "capeNamePurple", textureUsername: "ProfMobius" },
  { id: "follower", nameKey: "capeNameFollower", textureUsername: "direwolf20" },
  { id: "twitch", nameKey: "capeNameTwitch", textureUsername: "Twitch" },
  { id: "minecon", nameKey: "capeNameMinecon", textureUsername: "MrMessiah" },
  { id: "yearn", nameKey: "capeNameYearn", textureUsername: "billyK_" },
];

export function getCapeById(capeId: string | null | undefined): CapeItem | null {
  if (!capeId || capeId === NO_CAPE_ID) return null;
  return CAPE_CATALOG.find((c) => c.id === capeId) ?? null;
}

export function getSkinAvatarUrl(
  username: string,
  size = 64,
  model: SkinModel = "classic",
): string {
  const encoded = encodeURIComponent(username);
  const query = model === "slim" ? "?model=slim" : "";
  return `https://crafthead.net/avatar/${encoded}/${size}${query}`;
}

export function getSkinBodyUrl(
  username: string,
  model: SkinModel = "classic",
): string {
  const encoded = encodeURIComponent(username);
  const query = model === "slim" ? "?model=slim" : "";
  return `https://crafthead.net/body/${encoded}${query}`;
}

export function getCapeImageUrl(textureUsername: string): string {
  return `https://mc-heads.net/cape/${encodeURIComponent(textureUsername)}`;
}

export function loadSelectedSkin(): SelectedSkin | null {
  try {
    const keys = [SKIN_STORAGE_KEY, LEGACY_NUVOXEL_SKIN, LEGACY_SKIN];
    let raw: string | null = null;
    for (const key of keys) {
      raw = localStorage.getItem(key);
      if (raw) break;
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SelectedSkin;
    return {
      ...parsed,
      model: parsed.model === "slim" ? "slim" : "classic",
      capeId: parsed.capeId ?? null,
      customSkinData:
        typeof parsed.customSkinData === "string"
          ? parsed.customSkinData
          : null,
      customCapeData:
        typeof parsed.customCapeData === "string"
          ? parsed.customCapeData
          : null,
    };
  } catch {
    return null;
  }
}

export function saveSelectedSkin(skin: SelectedSkin): void {
  localStorage.setItem(SKIN_STORAGE_KEY, JSON.stringify(skin));
  window.dispatchEvent(new CustomEvent(SKIN_CHANGE_EVENT, { detail: skin }));
}

export function loadWebAuth(): WebAuthSession | null {
  try {
    const keys = [AUTH_STORAGE_KEY, LEGACY_NUVOXEL_AUTH, LEGACY_AUTH];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as WebAuthSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveWebAuth(auth: WebAuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: auth }));
}

export function clearWebAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: null }));
}
