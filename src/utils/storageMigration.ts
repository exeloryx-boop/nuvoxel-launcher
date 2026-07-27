import {
  LEGACY_AUTH,
  LEGACY_LANG,
  LEGACY_NUVOXEL_AUTH,
  LEGACY_NUVOXEL_LANG,
  LEGACY_NUVOXEL_SKIN,
  LEGACY_SESSION_FIELD,
  LEGACY_SESSIONS_FIELD,
  LEGACY_SKIN,
  LEGACY_V2_STORE,
  LEGACY_V3_STORE,
  LEGACY_ACCOUNT_TYPE,
  LEGACY_USER_ID_FIELD,
} from "../../shared/legacyStorageKeys";

const LEGACY_STORE_KEYS = [LEGACY_V2_STORE, LEGACY_V3_STORE] as const;

export const STORE_KEY = "nuvolexlauncher-storage-v1";

const LEGACY_LANG_KEYS = [LEGACY_LANG, LEGACY_NUVOXEL_LANG] as const;
export const LANG_KEY = "nuvolexlauncher-language";
export const LANG_CHANGE_EVENT = "nuvolexlauncher-language-change";

export const SKIN_STORAGE_KEY = "nuvolexlauncher-selected-skin";
const LEGACY_SKIN_KEYS = [LEGACY_SKIN, LEGACY_NUVOXEL_SKIN] as const;

export const AUTH_STORAGE_KEY = "nuvolexlauncher-web-auth";
const LEGACY_AUTH_KEYS = [LEGACY_AUTH, LEGACY_NUVOXEL_AUTH] as const;

function migratePersistedState(state: Record<string, unknown>): Record<string, unknown> {
  const next = { ...state };

  if (LEGACY_SESSION_FIELD in next) {
    next.nuvoxelSession = next[LEGACY_SESSION_FIELD];
    delete next[LEGACY_SESSION_FIELD];
  }
  if (LEGACY_SESSIONS_FIELD in next) {
    next.nuvoxelSessions = next[LEGACY_SESSIONS_FIELD];
    delete next[LEGACY_SESSIONS_FIELD];
  }

  if (Array.isArray(next.accounts)) {
    next.accounts = next.accounts.map((raw) => {
      const account = { ...(raw as Record<string, unknown>) };
      if (account.type === LEGACY_ACCOUNT_TYPE) {
        account.type = "nuvoxel";
      }
      if (account[LEGACY_USER_ID_FIELD] != null && account.nuvoxelUserId == null) {
        account.nuvoxelUserId = account[LEGACY_USER_ID_FIELD];
      }
      delete account[LEGACY_USER_ID_FIELD];
      return account;
    });
  }

  return next;
}

function readFirstLegacyKey(keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

export function migrateLegacyStorage(): void {
  if (typeof localStorage === "undefined") return;

  if (!localStorage.getItem(STORE_KEY)) {
    const legacy = readFirstLegacyKey(LEGACY_STORE_KEYS);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy) as { state?: Record<string, unknown> };
        if (parsed.state) {
          parsed.state = migratePersistedState(parsed.state);
        }
        localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
      } catch {
        /* keep empty new store */
      }
    }
  }

  if (!localStorage.getItem(LANG_KEY)) {
    const legacyLang = readFirstLegacyKey(LEGACY_LANG_KEYS);
    if (legacyLang) {
      localStorage.setItem(LANG_KEY, legacyLang);
    }
  }

  if (!localStorage.getItem(SKIN_STORAGE_KEY)) {
    const legacySkin = readFirstLegacyKey(LEGACY_SKIN_KEYS);
    if (legacySkin) {
      localStorage.setItem(SKIN_STORAGE_KEY, legacySkin);
    }
  }

  if (!localStorage.getItem(AUTH_STORAGE_KEY)) {
    const legacyAuth = readFirstLegacyKey(LEGACY_AUTH_KEYS);
    if (legacyAuth) {
      localStorage.setItem(AUTH_STORAGE_KEY, legacyAuth);
    }
  }
}
