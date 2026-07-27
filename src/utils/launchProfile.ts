const LOW_END_JVM =
  "-XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20";

export function mergeJvmParams(base: string, extra: string): string {
  const parts = `${base} ${extra}`.trim().split(/\s+/).filter(Boolean);
  return [...new Set(parts)].join(" ");
}

export function resolveLaunchProfile(options: {
  memoryMb: number;
  jvmParams: string;
  simultaneousDownloads: number;
  lowEndMode: boolean;
  integrityCheck: boolean;
}): {
  memoryMb: number;
  jvmParams: string;
  simultaneousDownloads: number;
  integrityCheck: boolean;
} {
  if (!options.lowEndMode) return options;

  return {
    memoryMb: Math.min(options.memoryMb, 2048),
    jvmParams: mergeJvmParams(options.jvmParams, LOW_END_JVM),
    simultaneousDownloads: Math.min(options.simultaneousDownloads, 2),
    integrityCheck: false,
  };
}
