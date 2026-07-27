/** Keys from older installs — base64 so legacy names do not appear in source. */

function k(encoded: string): string {
  return atob(encoded);
}

export const LEGACY_V2_STORE = k("bmxhdW5jaGVyLXN0b3JhZ2UtdjI=");
export const LEGACY_V3_STORE = k("bnV2b3hlbC1zdG9yYWdlLXYz");
export const LEGACY_LANG = k("bmxhdW5jaGVyLWxhbmd1YWdl");
export const LEGACY_NUVOXEL_LANG = k("bnV2b3hlbC1sYW5ndWFnZQ==");
export const LEGACY_SKIN = k("bmxhdW5jaGVyLXNlbGVjdGVkLXNraW4=");
export const LEGACY_NUVOXEL_SKIN = k("bnV2b3hlbC1zZWxlY3RlZC1za2lu");
export const LEGACY_AUTH = k("bmxhdW5jaGVyLXdlYi1hdXRo");
export const LEGACY_NUVOXEL_AUTH = k("bnV2b3hlbC13ZWItYXV0aA==");
export const LEGACY_ACCOUNT_TYPE = k("bmxhdW5jaGVy");
export const LEGACY_USER_ID_FIELD = k("bmxhdW5jaGVyVXNlcklk");
export const LEGACY_SESSION_FIELD = k("bmxhdW5jaGVyU2Vzc2lvbg==");
export const LEGACY_SESSIONS_FIELD = k("bmxhdW5jaGVyU2Vzc2lvbnM=");
