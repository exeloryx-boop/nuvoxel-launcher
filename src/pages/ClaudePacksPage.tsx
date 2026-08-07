import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clipboard,
  Download,
  Loader2,
  PackagePlus,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import {
  fetchSharedPacks,
  importSharedPack,
  publishSharedPack,
} from "../services/nuvoxelApi";
import { SocialApiError, type SharedPack } from "../types/social";
import type { CatalogItem } from "../types/mods";

const statusStyle = {
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  blocked: "border-red-500/30 bg-red-500/10 text-red-300",
} as const;

const statusLabel = {
  approved: "Схвалено",
  pending: "На перевірці",
  blocked: "Заблоковано",
} as const;

export function ClaudePacksPage() {
  const session = useAppStore((state) => state.nuvoxelSession);
  const modPacks = useAppStore((state) => state.modPacks);
  const createModPack = useAppStore((state) => state.createModPack);
  const addModToPack = useAppStore((state) => state.addModToPack);
  const setActiveModPack = useAppStore((state) => state.setActiveModPack);
  const [selectedPackId, setSelectedPackId] = useState("");
  const [description, setDescription] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [packs, setPacks] = useState<SharedPack[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");

  const selectedPack = useMemo(
    () => modPacks.find((pack) => pack.id === selectedPackId) ?? modPacks[0],
    [modPacks, selectedPackId],
  );

  const refreshPacks = async () => {
    if (!session) return;
    try {
      setPacks(await fetchSharedPacks(session.token));
    } catch {
      setNotice("Не вдалося завантажити спільні збірки. Перевірте підключення.");
    }
  };

  useEffect(() => {
    void refreshPacks();
  }, [session?.token]);

  const publish = async () => {
    if (!session) {
      setNotice("Увійдіть у Nuvoxel ID, щоб опублікувати збірку.");
      return;
    }
    if (!selectedPack) {
      setNotice("Спочатку створіть або встановіть локальну збірку.");
      return;
    }

    setLoading(true);
    setNotice("");
    try {
      const shared = await publishSharedPack(session.token, {
        name: selectedPack.name,
        description,
        minecraftVersion: selectedPack.minecraftVersion,
        loader: selectedPack.loader,
        mods: (selectedPack.mods ?? []).map((mod) => ({
          projectId: mod.projectId,
          versionId: mod.versionId,
          name: mod.name,
          author: mod.author,
          iconUrl: mod.iconUrl,
          catalogSource: mod.catalogSource === "curseforge" ? "curseforge" : "modrinth",
        })),
      });
      setPacks((current) => [shared, ...current]);
      setNotice(`Збірку надіслано на перевірку. Ваш код: ${shared.code}`);
      setDescription("");
    } catch (error) {
      setNotice(error instanceof SocialApiError ? "Не вдалося надіслати збірку." : "Помилка публікації збірки.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setNotice("Код скопійовано. Надішліть його другу.");
  };

  const installSharedPack = async () => {
    if (!session || !shareCode.trim() || importing) return;
    setImporting(true);
    setNotice("");
    try {
      const shared = await importSharedPack(session.token, shareCode);
      // A repeated import continues a partial download instead of creating a
      // duplicate profile for the same cloud build.
      const existing = useAppStore.getState().modPacks.find(
        (pack) => pack.name === shared.name &&
          pack.minecraftVersion === shared.minecraftVersion &&
          pack.loader === shared.loader,
      );
      const localPackId = existing?.id ?? createModPack({
        name: shared.name,
        minecraftVersion: shared.minecraftVersion,
        loader: shared.loader,
      });
      setActiveModPack(localPackId);
      let installed = 0;
      let failed = 0;
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
        if (await addModToPack(localPackId, catalogItem, { versionId: mod.versionId })) installed += 1;
        else failed += 1;
      }
      setShareCode("");
      setNotice(
        failed === 0
          ? `Збірку «${shared.name}» додано: встановлено модів ${installed}/${shared.modCount}.`
          : `Збірку «${shared.name}» збережено, але ${failed} модів не вдалося завантажити. Повторіть імпорт за тим самим кодом — дубліката не буде.`,
      );
    } catch (error) {
      const reason = error instanceof SocialApiError && error.code === "PACK_BLOCKED"
        ? "Цю збірку заблоковано модерацією."
        : error instanceof SocialApiError && error.code === "PACK_PENDING"
          ? "Збірка ще проходить перевірку."
          : "Не вдалося отримати збірку за цим кодом.";
      setNotice(reason);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-7 flex items-start justify-between gap-4 animate-fade-in-up">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Nuvoxel Share</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-text-primary">
            <Sparkles className="h-6 w-6 text-violet-400" /> Claude збірки
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Діліться своїми модзбірками через короткий код і встановлюйте перевірені збірки друзів.</p>
        </div>
      </div>

      {!session ? (
        <div className="glass-card max-w-2xl p-6 text-sm text-text-secondary">
          Увійдіть у Nuvoxel ID через вкладку «Акаунти», щоб створювати й отримувати збірки.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="glass-card p-5 animate-fade-in-up">
            <div className="mb-4 flex items-center gap-2 text-text-primary"><Send className="h-5 w-5 text-[var(--accent)]" /> Поділитися збіркою</div>
            <label className="mb-3 block text-xs font-semibold text-text-secondary">Локальна збірка</label>
            <select value={selectedPack?.id ?? ""} onChange={(event) => setSelectedPackId(event.target.value)} className="no-drag mb-3 w-full rounded-xl border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-[var(--accent)]">
              {modPacks.length === 0 ? <option>Немає локальних збірок</option> : modPacks.map((pack) => <option key={pack.id} value={pack.id}>{pack.name} · {pack.minecraftVersion} · {pack.mods?.length ?? 0} модів</option>)}
            </select>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={400} placeholder="Коротко опишіть збірку (необов'язково)" className="no-drag min-h-24 w-full rounded-xl border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-[var(--accent)]" />
            <p className="mt-2 text-xs text-text-muted">Після публікації збірка потрапляє в чергу модерації. Код стає доступним лише після схвалення.</p>
            <button type="button" onClick={() => void publish()} disabled={loading || !selectedPack} className="no-drag mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />} Надіслати на перевірку
            </button>
          </section>

          <section className="glass-card p-5 animate-fade-in-up">
            <div className="mb-4 flex items-center gap-2 text-text-primary"><Download className="h-5 w-5 text-[var(--accent)]" /> Отримати збірку друга</div>
            <p className="mb-3 text-sm text-text-secondary">Вставте код друга. Лаунчер створить профіль і завантажить моди саме у вказаних версіях.</p>
            <div className="flex gap-2">
              <input value={shareCode} onChange={(event) => setShareCode(event.target.value.toUpperCase())} maxLength={10} placeholder="Наприклад: NUV0XEL123" className="no-drag min-w-0 flex-1 rounded-xl border border-border bg-bg-primary px-3 py-2.5 font-mono text-sm tracking-wider text-text-primary outline-none placeholder:tracking-normal focus:border-[var(--accent)]" />
              <button type="button" onClick={() => void installSharedPack()} disabled={!shareCode.trim() || importing} className="no-drag rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-50">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Встановити"}
              </button>
            </div>
            <div className="mt-5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs leading-relaxed text-violet-200">Перевірка виконується в адмін-панелі. Збірки з небезпечним або несумісним вмістом можуть бути заблоковані з поясненням для автора.</div>
          </section>
        </div>
      )}

      {notice && <div className="mt-5 flex items-start gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3 text-sm text-text-primary animate-fade-in-up"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />{notice}</div>}

      <section className="mt-7 animate-fade-in-up">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-text-primary">Мої та схвалені збірки</h2><button type="button" onClick={() => void refreshPacks()} className="no-drag text-xs font-semibold text-[var(--accent)] hover:underline">Оновити</button></div>
        <div className="grid gap-3 lg:grid-cols-2">
          {packs.map((pack) => <article key={pack.id} className="glass-card p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-text-primary">{pack.name}</h3><p className="mt-1 text-xs text-text-muted">{pack.authorUsername} · {pack.minecraftVersion} · {pack.loader} · {pack.modCount} модів</p></div><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusStyle[pack.status]}`}>{statusLabel[pack.status]}</span></div>
            {pack.description && <p className="mt-3 text-sm text-text-secondary">{pack.description}</p>}
            {pack.status === "approved" && <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-bg-primary px-3 py-2"><code className="flex-1 text-xs tracking-wider text-text-primary">{pack.code}</code><button type="button" onClick={() => void copyCode(pack.code)} className="no-drag text-text-secondary hover:text-text-primary" title="Копіювати код"><Clipboard className="h-4 w-4" /></button></div>}
            {pack.status === "blocked" && <p className="mt-3 flex gap-1.5 text-xs text-red-300"><ShieldAlert className="h-4 w-4 shrink-0" />Причина: {pack.reviewReason || "не вказано"}</p>}
          </article>)}
          {packs.length === 0 && <p className="text-sm text-text-muted">Поки що немає доступних збірок.</p>}
        </div>
      </section>
    </div>
  );
}
