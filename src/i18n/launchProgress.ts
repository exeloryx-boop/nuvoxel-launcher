import { t, type TranslationKey } from "./index";

export interface LaunchProgressPayload {
  stage: string;
  n?: number;
  total?: number;
  percent?: number;
}

const STAGE_KEYS: Record<string, TranslationKey> = {
  loader: "progressLoader",
  nuvoxel: "progressNuvoxel",
  manifest: "progressManifest",
  client: "progressClient",
  libraries: "progressLibraries",
  natives: "progressNatives",
  assets: "progressAssets",
  skin: "progressSkin",
  session: "progressSession",
  starting: "progressStarting",
  done: "progressDone",
};

export function translateLaunchProgress(p: LaunchProgressPayload): string {
  const key = STAGE_KEYS[p.stage];
  if (!key) return p.stage;

  if (p.stage === "libraries" && p.n != null && p.total != null) {
    return t("progressLibrariesCount", { n: p.n, total: p.total });
  }
  if (p.stage === "assets" && p.n != null && p.total != null) {
    return t("progressAssetsCount", { n: p.n, total: p.total });
  }
  return t(key);
}

export function translateLaunchError(raw: string): string {
  if (raw === "ERR_DESKTOP_ONLY") return t("launchDesktopOnly");
  if (raw === "ERR_MAIN_CLASS") return t("errMainClass");
  if (raw === "ERR_NUVOXEL_CLIENT_URL") {
    return "Не вдалося визначити адресу моду Nuvoxel. Перевірте сервер Nuvoxel у налаштуваннях.";
  }
  if (raw === "ERR_NUVOXEL_CLIENT_UNAVAILABLE") {
    return "Мод Nuvoxel ще не опублікований на сервері.";
  }
  if (raw.startsWith("ERR_NUVOXEL_UNSUPPORTED_VERSION:")) {
    return `Nuvoxel Client підтримує Minecraft 1.21.4–26.2, а не ${raw.slice("ERR_NUVOXEL_UNSUPPORTED_VERSION:".length)}.`;
  }
  if (raw === "ERR_NUVOXEL_REQUIRES_FABRIC") {
    return "Nuvoxel Client потребує Fabric Loader.";
  }
  if (raw.startsWith("ERR_NUVOXEL_FABRIC_API_UNAVAILABLE:")) {
    return `Для Minecraft ${raw.slice("ERR_NUVOXEL_FABRIC_API_UNAVAILABLE:".length)} ще немає сумісної Fabric API.`;
  }
  if (raw.startsWith("ERR_NUVOXEL_FABRIC_API")) {
    return "Не вдалося завантажити або перевірити Fabric API для Nuvoxel Client.";
  }
  if (raw.startsWith("ERR_NUVOXEL_CLIENT_DOWNLOAD:")) {
    return "Не вдалося завантажити мод Nuvoxel. Перевірте підключення до інтернету та повторіть спробу.";
  }

  if (raw.startsWith("ERR_LOG_CREATE:")) {
    const path = raw.slice("ERR_LOG_CREATE:".length);
    return t("errLogCreate", { path });
  }

  if (raw.startsWith("ERR_JAVA_SPAWN:")) {
    const rest = raw.slice("ERR_JAVA_SPAWN:".length);
    const sep = rest.indexOf("|");
    if (sep >= 0) {
      const java = rest.slice(0, sep);
      const version = rest.slice(sep + 1);
      return t("errJavaSpawn", { java, version });
    }
  }

  if (raw.startsWith("ERR_EXIT_EARLY:")) {
    const rest = raw.slice("ERR_EXIT_EARLY:".length);
    const sep = rest.indexOf("|");
    if (sep >= 0) {
      const code = rest.slice(0, sep);
      const log = rest.slice(sep + 1);
      return t("errExitEarly", { code, log });
    }
  }

  if (raw.startsWith("ERR_UNKNOWN_LOADER:")) {
    return t("errUnknownLoader", { loader: raw.slice("ERR_UNKNOWN_LOADER:".length) });
  }
  if (raw.startsWith("ERR_FABRIC_NO_LOADER:")) {
    return t("errFabricNoLoader", { version: raw.slice("ERR_FABRIC_NO_LOADER:".length) });
  }
  if (raw.startsWith("ERR_QUILT_NO_LOADER:")) {
    return t("errQuiltNoLoader", { version: raw.slice("ERR_QUILT_NO_LOADER:".length) });
  }
  if (raw.startsWith("ERR_FORGE_NO_VERSION:")) {
    return t("errForgeNoVersion", { version: raw.slice("ERR_FORGE_NO_VERSION:".length) });
  }
  if (raw.startsWith("ERR_NEOFORGE_NO_VERSION:")) {
    return t("errNeoForgeNoVersion", {
      version: raw.slice("ERR_NEOFORGE_NO_VERSION:".length),
    });
  }
  if (raw.startsWith("ERR_FORGE_INSTALL") ||
    raw.startsWith("ERR_FORGE_INSTALL_FAILED")
  ) {
    return t("errForgeInstallFailed");
  }
  if (raw === "ERR_JVM_UNRESOLVED_VARS") {
    return t("errJvmUnresolvedVars");
  }
  if (raw.startsWith("ERR_JAVA_TOO_OLD:")) {
    const parts = raw.slice("ERR_JAVA_TOO_OLD:".length).split("|");
    return t("errJavaTooOld", {
      major: parts[0] ?? "?",
      min: parts[1] ?? "?",
      version: parts[2] ?? "?",
    });
  }
  if (raw.startsWith("ERR_JAVA_NOT_FOUND:")) {
    const parts = raw.slice("ERR_JAVA_NOT_FOUND:".length).split("|");
    return t("errJavaNotFound", {
      min: parts[0] ?? "?",
      version: parts[1] ?? "?",
    });
  }
  if (raw.startsWith("ERR_JAVA_PATH_INVALID:")) {
    return t("errJavaPathInvalid", {
      path: raw.slice("ERR_JAVA_PATH_INVALID:".length),
    });
  }
  if (raw.startsWith("ERR_LIBS_MISSING:")) {
    const paths = raw.slice("ERR_LIBS_MISSING:".length);
    return t("errLibsMissing", { paths });
  }
  if (raw.startsWith("ERR_NATIVES_EMPTY:")) {
    return t("errNativesEmpty");
  }

  return raw;
}
