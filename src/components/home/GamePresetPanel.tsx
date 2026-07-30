import { Zap, ShieldCheck, Sparkles, Cpu } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { SHIMMER_SURFACE } from "../../utils/shimmer";

export function GamePresetPanel() {
  const memoryMb = useAppStore((s) => s.memoryMb);
  const setMemoryMb = useAppStore((s) => s.setMemoryMb);
  const setJvmParams = useAppStore((s) => s.setJvmParams);
  const showToast = useAppStore((s) => s.showToast);

  const presets = [
    {
      id: "pvp",
      name: "⚡ PvP Turbo (High FPS)",
      ram: 4096,
      args: "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=50",
      desc: "Оптимальний підбір для мінімального закриття та високого FPS на PvP серверах.",
      icon: <Zap className="h-4 w-4 text-amber-400" />,
      color: "border-amber-500/30 hover:border-amber-400 bg-amber-500/5",
    },
    {
      id: "modded",
      name: "🎮 Cybercraft Modded",
      ram: 8192,
      args: "-XX:+UseZGC -XX:+UnlockExperimentalVMOptions -XX:ZAllocationSpikeTolerance=5",
      desc: "Призначено для важких модпаків з 100+ модами без фризів.",
      icon: <Cpu className="h-4 w-4 text-purple-400" />,
      color: "border-purple-500/30 hover:border-purple-400 bg-purple-500/5",
    },
    {
      id: "shaders",
      name: "🎨 Visual Shaders Ultra",
      ram: 6144,
      args: "-XX:+UseShenandoahGC -XX:ShenandoahGCHeuristics=compact",
      desc: "Максимальне виділення ресурсів під фотореалістичні шейдери.",
      icon: <Sparkles className="h-4 w-4 text-cyan-400" />,
      color: "border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/5",
    },
    {
      id: "vanilla",
      name: "🌿 Vanilla Clean",
      ram: 2048,
      args: "",
      desc: "Стандартний режим для ванільного Minecraft без зайвого навантаження.",
      icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
      color: "border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/5",
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setMemoryMb(preset.ram);
    setJvmParams(preset.args);
    showToast("presetApplied");
    setTimeout(() => useAppStore.getState().clearToast(), 2500);
  };

  return (
    <div className={`${SHIMMER_SURFACE} rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 mt-3`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-text-primary">Профілі Оптимізації (v0.7.0)</h3>
        </div>
        <span className="text-[11px] text-text-muted">ОЗУ: {(memoryMb / 1024).toFixed(1)} GB</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {presets.map((p) => {
          const isActive = memoryMb === p.ram;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={`no-drag text-left p-3 rounded-xl border transition flex items-start gap-2.5 ${p.color} ${
                isActive ? "ring-2 ring-[var(--accent)] shadow-lg shadow-[var(--accent)]/10" : ""
              }`}
            >
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 shrink-0">
                {p.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{p.name}</span>
                  {isActive && (
                    <span className="text-[10px] bg-[var(--accent)]/20 text-[var(--accent)] font-semibold px-1.5 py-0.2 rounded">
                      Активний
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-tight">
                  {p.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
