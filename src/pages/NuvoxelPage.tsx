import { CheckCircle2, Download, Gamepad2, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useMinecraftVersions } from "../hooks/useMinecraftVersions";
import { useAppStore } from "../store/useAppStore";

const MIN_VERSION = [1, 21, 4];
const MAX_VERSION = [26, 2, 0];

function versionParts(version: string): number[] | null {
  if (!/^\d+(?:\.\d+){1,2}$/.test(version)) return null;
  return version.split(".").map(Number);
}

function inNuvoxelRange(version: string): boolean {
  const parts = versionParts(version);
  if (!parts) return false;
  const normalized = [...parts, 0, 0].slice(0, 3);
  const compare = (a: number[], b: number[]) => a.findIndex((n, i) => n !== b[i]);
  const lower = compare(normalized, MIN_VERSION);
  const upper = compare(normalized, MAX_VERSION);
  return (lower === -1 || normalized[lower] > MIN_VERSION[lower]) &&
    (upper === -1 || normalized[upper] < MAX_VERSION[upper]);
}

/** Nuvoxel profiles use one Fabric module kept apart from normal installations. */
export function NuvoxelPage() {
  const navigate = useNavigate();
  const { versions, loading } = useMinecraftVersions();
  const minecraftVersion = useAppStore((s) => s.minecraftVersion);
  const clientMode = useAppStore((s) => s.clientMode);
  const setMinecraftVersion = useAppStore((s) => s.setMinecraftVersion);
  const setVersionPickerLoader = useAppStore((s) => s.setVersionPickerLoader);
  const setClientMode = useAppStore((s) => s.setClientMode);
  const setActiveModPack = useAppStore((s) => s.setActiveModPack);
  const play = useAppStore((s) => s.play);

  const profiles = useMemo(
    () => versions.filter((version) => version.type === "release" && inNuvoxelRange(version.id)),
    [versions],
  );

  const chooseProfile = (version: string) => {
    setMinecraftVersion(version);
    setVersionPickerLoader("fabric");
    setActiveModPack(null);
    setClientMode("nuvoxel");
  };

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8">
      <section className="overflow-hidden rounded-3xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/20 via-bg-card to-bg-secondary p-7 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-6"><div className="max-w-2xl"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /> NUVOXEL CLIENT</div><h1 className="text-3xl font-black tracking-tight text-text-primary">Minecraft з можливостями Nuvoxel</h1><p className="mt-3 text-sm leading-6 text-text-secondary">Обери версію — перед запуском лаунчер автоматично поставить Nuvoxel-мод і Fabric у профіль гри. Звичайні профілі та збірки не змінюються.</p></div><button type="button" onClick={() => void play()} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 font-bold text-white shadow-lg transition hover:brightness-110"><Gamepad2 className="h-5 w-5" /> Грати</button></div>
      </section>

      <section className="mt-7"><div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-xl font-bold text-text-primary">Профілі Nuvoxel</h2><p className="mt-1 text-sm text-text-muted">Fabric-версії від 1.21.4 до 26.2.</p></div><span className="rounded-full bg-bg-secondary px-3 py-1 text-xs text-text-secondary">Вибрано: {clientMode === "nuvoxel" ? minecraftVersion : "немає"}</span></div>
        {loading ? <div className="flex items-center gap-2 py-8 text-text-muted"><Loader2 className="h-5 w-5 animate-spin" /> Завантаження версій…</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{profiles.map((profile) => { const selected = clientMode === "nuvoxel" && minecraftVersion === profile.id; return <article key={profile.id} className={`rounded-2xl border p-5 transition ${selected ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-border bg-bg-card"}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-bold text-text-primary">Minecraft {profile.id}</h3><p className="mt-1 text-sm text-text-muted">Fabric · Nuvoxel Client</p></div>{selected ? <CheckCircle2 className="h-6 w-6 text-[var(--accent)]" /> : null}</div><div className="mt-5 flex gap-2"><button type="button" onClick={() => chooseProfile(profile.id)} className="flex-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text-primary hover:border-[var(--accent)]">{selected ? "Вибрано" : "Обрати"}</button><button type="button" onClick={() => { chooseProfile(profile.id); void play(); }} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white"><Download className="h-4 w-4" /> Запуск</button></div></article>; })}</div>}
      </section>
      <p className="mt-7 rounded-xl border border-border bg-bg-secondary/60 p-4 text-sm text-text-secondary">Сумісність моду обмежена 26.2: новіші версії не відображаються, доки їх не буде перевірено.</p><button type="button" onClick={() => navigate("/mods")} className="mt-4 text-sm font-semibold text-[var(--accent)] hover:underline">Відкрити звичайні моди та збірки →</button>
    </div>
  );
}
