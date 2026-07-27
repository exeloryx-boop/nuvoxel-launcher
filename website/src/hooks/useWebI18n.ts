import { useCallback, useEffect, useState } from "react";
import {
  getLocaleTag,
  getSkinCategoryLabel,
  LANGUAGE_STORAGE_KEY,
  readStoredLanguage,
  setI18nLocale,
  type Locale,
} from "../../../src/i18n";
import { LANG_CHANGE_EVENT } from "../../../src/utils/storageMigration";
import { wt, type WebKey } from "../i18n/web";

export function useWebI18n() {
  const [locale, setLocale] = useState<Locale>(() => readStoredLanguage());

  useEffect(() => {
    const sync = () => setLocale(readStoredLanguage());
    window.addEventListener("storage", sync);
    window.addEventListener(LANG_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(LANG_CHANGE_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    setI18nLocale(locale);
  }, [locale]);

  const setLanguage = useCallback((lang: Locale) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    setI18nLocale(lang);
    setLocale(lang);
    window.dispatchEvent(new Event(LANG_CHANGE_EVENT));
  }, []);

  const t = useCallback(
    (key: WebKey, params?: Record<string, string | number>) =>
      wt(locale, key, params),
    [locale],
  );

  return {
    locale,
    localeTag: getLocaleTag(locale),
    setLanguage,
    t,
    skinCategory: getSkinCategoryLabel,
  };
}
