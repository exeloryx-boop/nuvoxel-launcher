import { useEffect, useMemo } from "react";
import {
  getLocaleTag,
  setI18nLocale,
  t,
  type Locale,
  type TranslationKey,
} from "../i18n";
import { useAppStore } from "../store/useAppStore";

export function useTranslation() {
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    setI18nLocale(language as Locale);
  }, [language]);

  return useMemo(
    () => ({
      t: (key: TranslationKey, params?: Record<string, string | number>) =>
        t(key, params),
      language,
      localeTag: getLocaleTag(language as Locale),
    }),
    [language],
  );
}
