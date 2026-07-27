export interface LaunchOptions {
  version: string;
  username: string;
  gameDir: string;
  memoryMb: number;
  jvmParams: string;
  javaPath?: string;
  skinUsername?: string;
  skinModel?: string;
  skinCapeUsername?: string;
  customSkinData?: string;
  customCapeData?: string;
  loader: string;
  integrityCheck: boolean;
  simultaneousDownloads: number;
  serverAddress?: string;
  serverPort?: number;
  language?: string;
  /** local | nuvoxel = offline; microsoft = licensed, no authlib bypass */
  accountType?: string;
  resolution?: string;
}

export interface LaunchProgress {
  stage: string;
  n?: number;
  total?: number;
  percent?: number;
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function launchMinecraft(
  options: LaunchOptions,
  onProgress?: (p: LaunchProgress) => void,
): Promise<number> {
  if (!isTauri()) {
    throw new Error("ERR_DESKTOP_ONLY");
  }

  const { invoke } = await import("@tauri-apps/api/core");
  const { listen } = await import("@tauri-apps/api/event");

  if (options.serverAddress) {
    try {
      const fullIp = options.serverPort
        ? `${options.serverAddress}:${options.serverPort}`
        : options.serverAddress;
      await invoke("add_server_to_servers_dat", {
        gameDir: options.gameDir,
        name: options.serverAddress,
        ip: fullIp,
      });
      console.log("Successfully ensured server in servers.dat:", fullIp);
    } catch (e) {
      console.error("Failed to add server to servers.dat:", e);
    }
  }

  let unlisten: (() => void) | undefined;
  if (onProgress) {
    unlisten = await listen<LaunchProgress>("launch-progress", (event) => {
      onProgress(event.payload);
    });
  }

  try {
    const pid = await invoke<number>("launch_minecraft", {
      options: {
        version: options.version,
        username: options.username,
        game_dir: options.gameDir,
        memory_mb: options.memoryMb,
        jvm_params: options.jvmParams,
        java_path: options.javaPath || null,
        skin_username: options.skinUsername || null,
        skin_model: options.skinModel || null,
        skin_cape_username: options.skinCapeUsername || null,
        custom_skin_data: options.customSkinData || null,
        custom_cape_data: options.customCapeData || null,
        loader: options.loader,
        integrity_check: options.integrityCheck,
        simultaneous_downloads: options.simultaneousDownloads,
        server_address: options.serverAddress || null,
        server_port: options.serverPort ?? null,
        language: options.language || null,
        account_type: options.accountType ?? "local",
        resolution: options.resolution ?? "windowed",
      },
    });
    return pid;
  } finally {
    unlisten?.();
  }
}

export async function detectJava(
  customPath?: string,
  mcVersion?: string,
): Promise<string> {
  if (!isTauri()) return "";
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("detect_java", {
    java_path: customPath?.trim() || null,
    mc_version: mcVersion || null,
  });
}
