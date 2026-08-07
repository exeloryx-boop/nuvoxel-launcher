import { CheckCircle2, Download, Gamepad2, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useMinecraftVersions } from "../hooks/useMinecraftVersions";
import { useAppStore } from "../store/useAppStore";

function parseVersion(v: string): number[] {
  return v
    .split("-")[0]
    .split(".")
    .map((num) => parseInt(num, 10))
    .filter((num) => !isNaN(num));
}

function compareVersions(v1: string, v2: string): number {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 !== num2) return num1 - num2;
  }
  return 0;
}

function isVersionInNuvoxelRange(versionId: string): boolean {
  return compareVersions(versionId, "1.21.4") >= 0 && compareVersions(versionId, "26.2") <= 0;
}

export function NuvoxelPage() {
  const { versions, loading } = useMinecraftVersions();
  const minecraftVersion = useAppStore((s) => s.minecraftVersion);
  const clientMode = useAppStore((s) => s.clientMode);
  const setMinecraftVersion = useAppStore((s) => s.setMinecraftVersion);
  const setVersionPickerLoader = useAppStore((s) => s.setVersionPickerLoader);
  const setClientMode = useAppStore((s) => s.setClientMode);
  const setActiveModPack = useAppStore((s) => s.setActiveModPack);
  const play = useAppStore((s) => s.play);

  // Filter release versions strictly from 1.21.4 to 26.2
  const profiles = useMemo(
    () =>
      versions.filter(
        (version) => version.type === "release" && isVersionInNuvoxelRange(version.id),
      ),
    [versions],
  );

  const chooseAndPlay = (version: string) => {
    setMinecraftVersion(version);
    setVersionPickerLoader("fabric");
    setActiveModPack(null);
    setClientMode("nuvoxel");
    void play();
  };

  const handleGlobalPlay = () => {
    if (profiles.length > 0) {
      const targetVersion = profiles.some((p) => p.id === minecraftVersion)
        ? minecraftVersion
        : profiles[0].id;
      setMinecraftVersion(targetVersion);
      setVersionPickerLoader("fabric");
      setActiveModPack(null);
      setClientMode("nuvoxel");
    }
    void play();
  };

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8">
      <section className="overflow-hidden rounded-3xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/20 via-bg-card to-bg-secondary p-7 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--accent)]">
              <ShieldCheck className="h-5 w-5" /> NUVOXEL VISUAL CLIENT v0.2.0
            </div>
            <h1 className="text-3xl font-black tracking-tight text-text-primary">Преміальний Візуальний Клієнт для Minecraft</h1>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Вбудований візуальний компаньйон із висувним <b>Dropdown ClickGUI (RSHIFT)</b>, анімованим HUD, KeyStrokes (WASD), Fullbright (H), Optifine Zoom (Z), Custom Crosshair (C), TimeChanger (P), ефектами Motion Blur та підтримкою версій від 1.21.4 до 26.2.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--accent)] flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Dropdown ClickGUI (RSHIFT)
              </span>
              <span className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-400">
                ◈ Dynamic HUD & Watermark
              </span>
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                ☀ Fullbright (H) & Zoom (Z)
              </span>
              <span className="rounded-lg border border-pink-500/30 bg-pink-500/10 px-3 py-1.5 text-xs font-semibold text-pink-400">
                ◉ Motion Blur & Crosshair (C)
              </span>
              <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
                ⚡ Auto Sprint (V) & Keystrokes
              </span>
            </div>
          </div>
          <button type="button" onClick={handleGlobalPlay} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3.5 font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95">
            <Gamepad2 className="h-5 w-5" /> Запустити Nuvoxel Client
          </button>
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Профілі Nuvoxel Client (1.21.4 – 26.2)</h2>
            <p className="mt-1 text-sm text-text-muted">Підтримуються версії Minecraft від 1.21.4 до 26.2 з Fabric Loader ({profiles.length} версій).</p>
          </div>
          <span className="rounded-full bg-bg-secondary border border-border px-4 py-1.5 text-xs font-semibold text-[var(--accent)]">
            Активний профіль: {clientMode === "nuvoxel" ? `Minecraft ${minecraftVersion} (Nuvoxel)` : "не обрано"}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" /> Завантаження версій…
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => {
              const selected = clientMode === "nuvoxel" && minecraftVersion === profile.id;
              return (
                <article key={profile.id} className={`rounded-2xl border p-5 transition-all duration-200 ${selected ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-lg shadow-[var(--accent)]/5" : "border-border bg-bg-card hover:border-border/80"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">Minecraft {profile.id}</h3>
                      <p className="mt-1 text-xs font-medium text-text-muted">Fabric Loader · Nuvoxel Visual Client</p>
                    </div>
                    {selected ? <CheckCircle2 className="h-6 w-6 text-[var(--accent)]" /> : null}
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => chooseAndPlay(profile.id)}
                      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 ${
                        selected
                          ? "bg-[var(--accent)] text-white shadow-md hover:brightness-110"
                          : "bg-bg-secondary border border-border text-text-primary hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      }`}
                    >
                      <Download className="h-4 w-4" />
                      {selected ? "Запустити зараз" : "Обрати та запустити"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-7 rounded-xl border border-border bg-bg-secondary/60 p-4 text-xs leading-5 text-text-secondary">
        При виборі версії Nuvoxel Client автоматично встановлює потрібну версію Fabric Loader, завантажує актуальний мод Nuvoxel і запускає його в ізольованому профілі без конфліктів.
      </p>
    </div>
  );
}
