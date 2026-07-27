import { t, type TranslationKey } from "../i18n";

const CATALOG_ERROR_KEYS: Record<string, TranslationKey> = {
  CURSEFORGE_NO_KEY: "curseforgeNoKey",
};

export function translateCatalogError(error: unknown): string {
  if (error instanceof Error) {
    const key = CATALOG_ERROR_KEYS[error.message];
    if (key) return t(key);
    if (error.message) return error.message;
  }
  return t("catalogError");
}
