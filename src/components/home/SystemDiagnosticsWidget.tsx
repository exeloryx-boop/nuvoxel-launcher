import { useState } from "react";
import { Cpu, Zap, Sparkles, Code } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { importSharedPack } from "../../services/nuvoxelApi";
import { SocialApiError } from "../../types/social";
import type { CatalogItem } from "../../types/mods";

export function SystemDiagnosticsWidget() {
  const memoryMb = useAppStore((s) => s.memoryMb);
  const setMemoryMb = useAppStore((s) => s.setMemoryMb);
  const setJvmParams = useAppStore((s) => s.setJvmParams);
  const showToast = useAppStore((s) => s.showToast);
  const clearToast = useAppStore((s) => s.clearToast);
  const session = useAppStore((s) => s.nuvoxelSession);
  const createModPack = useAppStore((s) => s.createModPack);
  const addModToPack = useAppStore((s) => s.addModToPack);

  const [importCode, setImportCode] = useState("");
  const [importing, setImporting] = useState(false);

  const handleOptimizeJvm = () => {
    // Inject ultra high performance G1GC flags
    const flags =
      "-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M";
    setJvmParams(flags);
    if (memoryMb < 4096) setMemoryMb(4096);
    showToast("JVM & RAM успішно оптимізовано під максимальний FPS!");
    setTimeout(() => clearToast(), 3000);
  };

  const handleQuickImportPack = async () => {
    if (!importCode.trim()) return;
    if (!session) {
      showToast("Увійдіть в акаунт, щоб завантажити збірку!");
      setTimeout(() => clearToast(), 3000);
      return;
    }
    setImporting(true);
    try {
      const shared = await importSharedPack(session.token, importCode.trim());
      const localPackId = createModPack({
        name: shared.name,
        minecraftVersion: shared.minecraftVersion,
        loader: shared.loader,
      });
      let installed = 0;
      for (const mod of shared.mods ?? []) {
        const catalogItem: CatalogItem = {
          id: mod.projectId,
          source: mod.catalogSource,
          kind: "mod",
          title: mod.name,
          description: "Shared Nuvoxel pack mod",
          author: mod.author,
          downloads: 0,
          follows: 0,
          iconUrl: mod.iconUrl,
          bannerUrl: null,
          categories: [],
        };
        if (await addModToPack(localPackId, catalogItem, { versionId: mod.versionId })) {
          installed += 1;
        }
      }
      setImportCode("");
      showToast(`Збірку «${shared.name}» імпортовано! (${installed} модів)`);
    } catch (error) {
      const reason =
        error instanceof SocialApiError && error.code === "PACK_BLOCKED"
          ? "Збірку заблоковано модерацією"
          : "Код збірки не знайдено або недійсний";
      showToast(reason);
    } finally {
      setImporting(false);
      setTimeout(() => clearToast(), 3500);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl transition shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--accent)]/15 p-2.5 text-[var(--accent)] border border-[var(--accent)]/30">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Nuvoxel Engine Diagnostics & Booster
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                READY
              </span>
            </h3>
            <p className="text-xs text-text-muted">
              Виділено RAM: <span className="text-white font-semibold">{memoryMb} MB</span> · Статус сервера:{" "}
              <span className="text-emerald-400 font-semibold">ONLINE (18 ms)</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOptimizeJvm}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition"
        >
          <Zap className="h-4 w-4 fill-current" />
          Оптимізувати FPS (JVM Booster)
        </button>
      </div>

      {/* Quick Import Shared Pack Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/[.03] p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary shrink-0">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          Вставити код збірки Claude:
        </div>
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            placeholder="Введіть код друзів (наприклад CLAUDE-9X2A)..."
            className="w-full rounded-lg border border-white/10 bg-black/50 py-1.5 pl-3 pr-8 text-xs outline-none focus:border-[var(--accent)]"
          />
          <Code className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
        </div>
        <button
          type="button"
          onClick={() => void handleQuickImportPack()}
          disabled={importing || !importCode.trim()}
          className="w-full sm:w-auto rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50 hover:bg-[var(--accent)]/90 transition shrink-0"
        >
          {importing ? "Завантаження..." : "Завантажити збірку"}
        </button>
      </div>
    </div>
  );
}
