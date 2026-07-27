import { ru } from "./ru";
import { uk } from "./uk";
import { en } from "./en";
import type { SkinCategory } from "@shared/skins";

export type Locale = "ru" | "uk" | "en";
export type TranslationKey = keyof typeof ru;

import { LANG_KEY, STORE_KEY } from "../utils/storageMigration";
import { LEGACY_V2_STORE, LEGACY_V3_STORE } from "../utils/legacyStorageKeys";

export const LANGUAGE_STORAGE_KEY = LANG_KEY;

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  ru,
  uk,
  en,
};

const SKIN_CATEGORY_KEYS: Record<SkinCategory, TranslationKey> = {
  popular: "skinCatPopular",
  boys: "skinCatBoys",
  girls: "skinCatGirls",
  anime: "skinCatAnime",
  fashion: "skinCatFashion",
  animals: "skinCatAnimals",
  games: "skinCatGames",
  movies: "skinCatMovies",
  pvp: "skinCatPvp",
  medieval: "skinCatMedieval",
  horror: "skinCatHorror",
  superheroes: "skinCatSuperheroes",
  memes: "skinCatMemes",
};

const LOCALE_TAGS: Record<Locale, string> = {
  ru: "ru-RU",
  uk: "uk-UA",
  en: "en-US",
};

const LANGUAGE_LABEL_KEYS: Record<Locale, TranslationKey> = {
  ru: "russian",
  uk: "ukrainian",
  en: "english",
};

let currentLocale: Locale = "ru";

export function setI18nLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  }
}

export function getI18nLocale(): Locale {
  return currentLocale;
}

export function getLocaleTag(locale: Locale = currentLocale): string {
  return LOCALE_TAGS[locale];
}

export function getLanguageLabel(locale: Locale = currentLocale): string {
  return t(LANGUAGE_LABEL_KEYS[locale]);
}

export function getSkinCategoryLabel(category: SkinCategory): string {
  return t(SKIN_CATEGORY_KEYS[category]);
}

export function getCapeLabel(nameKey: string): string {
  return t(nameKey as TranslationKey);
}

export function readStoredLanguage(): Locale {
  if (typeof localStorage === "undefined") return "ru";

  const direct = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (direct === "ru" || direct === "uk" || direct === "en") return direct;

  try {
    const raw =
      localStorage.getItem(STORE_KEY) ??
      localStorage.getItem(LEGACY_V3_STORE) ??
      localStorage.getItem(LEGACY_V2_STORE);
    const parsed = JSON.parse(raw ?? "{}") as {
      state?: { language?: string };
    };
    const lang = parsed?.state?.language;
    if (lang === "ru" || lang === "uk" || lang === "en") return lang;
  } catch {
    /* ignore */
  }

  return "ru";
}

export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  let text: string =
    dictionaries[currentLocale][key] ?? dictionaries.ru[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export { ru, uk, en };
export type { LaunchProgressPayload } from "./launchProgress";
export {
  translateLaunchProgress,
  translateLaunchError,
} from "./launchProgress";
