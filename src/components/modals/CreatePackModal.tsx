import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { t } from "../../i18n";
import { LoaderIcon, type LoaderIconId } from "../ui/LoaderIcon";
import { useAppStore } from "../../store/useAppStore";
import { useMinecraftVersions } from "../../hooks/useMinecraftVersions";
import type { ModLoader } from "../../types/mods";
import { OVERLAY_BACKDROP, OVERLAY_PANEL } from "../../utils/animations";

type PackLoaderChoice = ModLoader | "optifine";

const PACK_LOADERS: { id: PackLoaderChoice; label: string }[] = [
  { id: "vanilla", label: "Vanilla" },
  { id: "fabric", label: "Fabric" },
  { id: "quilt", label: "Quilt" },
  { id: "forge", label: "Forge" },
  { id: "neoforge", label: "NeoForge" },
  { id: "optifine", label: "Forge OptiFine" },
];

function toModLoader(choice: PackLoaderChoice): ModLoader {
  if (choice === "optifine") return "forge";
  return choice;
}

const TEMPLATES: {
  id: string;
  nameUk: string;
  nameRu: string;
  nameEn: string;
  descUk: string;
  descRu: string;
  descEn: string;
  defaultLoader: PackLoaderChoice;
  mods: { id: string; source: "modrinth"; title: string; kind: "mod" }[];
}[] = [
  {
    id: "empty",
    nameUk: "Чиста збірка",
    nameRu: "Чистая сборка",
    nameEn: "Vanilla custom",
    descUk: "Почніть з чистого листа без жодних встановлених модів",
    descRu: "Начните с чистого листа без предустановленных модов",
    descEn: "Start with a blank profile, with no preloaded mods",
    defaultLoader: "fabric",
    mods: [],
  },
  {
    id: "vanilla_plus",
    nameUk: "Оптимізація та FPS",
    nameRu: "Оптимизация и FPS",
    nameEn: "Optimization & QoL",
    descUk: "Sodium + Iris + Indium + Lithium для максимальної продуктивності та підтримки шейдерів",
    descRu: "Sodium + Iris + Indium + Lithium для максимальной производительности и шейдеров",
    descEn: "Sodium + Iris + Indium + Lithium for maximum performance and shader support",
    defaultLoader: "fabric",
    mods: [
      { id: "AANobbMI", source: "modrinth", title: "Sodium", kind: "mod" },
      { id: "YL575DfQ", source: "modrinth", title: "Iris Shaders", kind: "mod" },
      { id: "gv98mRYG", source: "modrinth", title: "Lithium", kind: "mod" },
      { id: "E5tHvArr", source: "modrinth", title: "Indium", kind: "mod" },
    ],
  },
  {
    id: "tech",
    nameUk: "Індустріальна база",
    nameRu: "Индустриальная база",
    nameEn: "Industrial starter",
    descUk: "Create та Just Enough Items (JEI) для фанатів автоматизації",
    descRu: "Create и Just Enough Items (JEI) для любителей автоматизации",
    descEn: "Create and Just Enough Items (JEI) for automation & recipe lookup",
    defaultLoader: "fabric",
    mods: [
      { id: "LN1v7TNs", source: "modrinth", title: "Create", kind: "mod" },
      { id: "u6th5ciA", source: "modrinth", title: "Just Enough Items (JEI)", kind: "mod" },
    ],
  },
  {
    id: "rpg",
    nameUk: "RPG Пригоди",
    nameRu: "RPG Приключения",
    nameEn: "RPG Adventure starter",
    descUk: "JourneyMap та Just Enough Items (JEI) для комфортних мандрів світом",
    descRu: "JourneyMap и Just Enough Items (JEI) для комфортных странствий по миру",
    descEn: "JourneyMap and Just Enough Items (JEI) for exploring the world",
    defaultLoader: "fabric",
    mods: [
      { id: "O4W0Aclg", source: "modrinth", title: "JourneyMap", kind: "mod" },
      { id: "u6th5ciA", source: "modrinth", title: "Just Enough Items (JEI)", kind: "mod" },
    ],
  },
];

const getTemplateName = (template: typeof TEMPLATES[0], lang: string) => {
  if (lang === "uk") return template.nameUk;
  if (lang === "ru") return template.nameRu;
  return template.nameEn;
};

const getTemplateDesc = (template: typeof TEMPLATES[0], lang: string) => {
  if (lang === "uk") return template.descUk;
  if (lang === "ru") return template.descRu;
  return template.descEn;
};

export function CreatePackModal() {
  const open = useAppStore((s) => s.showCreatePackModal);
  const setOpen = useAppStore((s) => s.setShowCreatePackModal);
  const createModPack = useAppStore((s) => s.createModPack);
  const addModToPack = useAppStore((s) => s.addModToPack);
  const language = useAppStore((s) => s.language);
  const { versions, loading } = useMinecraftVersions();

  const [name, setName] = useState("");
  const [mcVersion, setMcVersion] = useState("1.21.4");
  const [loader, setLoader] = useState<PackLoaderChoice>("fabric");
  const [selectedTemplateId, setSelectedTemplateId] = useState("empty");

  const versionList = useMemo(
    () =>
      versions.filter(
        (v) =>
          v.type === "release" ||
          v.type === "snapshot" ||
          v.type === "old_beta" ||
          v.type === "old_alpha",
      ),
    [versions],
  );

  const activeTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0],
    [selectedTemplateId],
  );

  const selectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      if (tmpl.defaultLoader) {
        setLoader(tmpl.defaultLoader);
      }
      const currentName = name.trim();
      const isDefaultName = TEMPLATES.some(
        (t) =>
          currentName === "" ||
          currentName === t.nameEn ||
          currentName === t.nameUk ||
          currentName === t.nameRu
      );
      if (isDefaultName) {
        setName(getTemplateName(tmpl, language));
      }
    }
  };

  useEffect(() => {
    if (open && versionList.length && !versionList.some((v) => v.id === mcVersion)) {
      setMcVersion(versionList[0].id);
    }
  }, [open, versionList, mcVersion]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const handleCreate = async () => {
    const packName = name.trim() || `${getTemplateName(activeTemplate, language)} ${mcVersion}`;
    const packId = createModPack({
      name: packName,
      minecraftVersion: mcVersion,
      loader: toModLoader(loader),
    });
    setName("");
    setLoader("fabric");
    setSelectedTemplateId("empty");

    if (activeTemplate.mods.length > 0) {
      for (const m of activeTemplate.mods) {
        try {
          await addModToPack(packId, {
            id: m.id,
            source: m.source,
            kind: m.kind,
            title: m.title,
            description: "",
            author: "",
            downloads: 0,
            follows: 0,
            iconUrl: null,
            bannerUrl: null,
            categories: [],
          });
        } catch (err) {
          console.error("Failed to install template mod:", m.title, err);
        }
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className={`${OVERLAY_BACKDROP} absolute inset-0 bg-black/55 backdrop-blur-xl`}
        onClick={() => setOpen(false)}
      />
      <div
        className={`no-drag ${OVERLAY_PANEL} relative z-10 w-full max-w-xl rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("createPackModalTitle")}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-text-muted transition hover:bg-white/5 hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5 max-h-[65vh] overflow-y-auto">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              {language === "uk" ? "Шаблон збірки" : language === "ru" ? "Шаблон сборки" : "Modpack Template"}
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {TEMPLATES.map((tmpl) => {
                const active = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => selectTemplate(tmpl.id)}
                    className={`no-drag flex flex-col items-start text-left p-3 rounded-xl border transition-all duration-200 ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                        : "border-white/10 bg-[#0a0a0f] hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xs font-semibold text-text-primary mb-1">
                      {getTemplateName(tmpl, language)}
                    </span>
                    <span className="text-[10px] text-text-muted leading-tight mb-2">
                      {getTemplateDesc(tmpl, language)}
                    </span>
                    {tmpl.mods.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-1">
                        {tmpl.mods.map((m) => (
                          <span
                            key={m.id}
                            className={`text-[8px] px-1 py-0.5 rounded font-medium ${
                              active
                                ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                                : "bg-white/5 text-text-secondary"
                            }`}
                          >
                            {m.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              {t("packNameLabel")}
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("packNamePlaceholderExample")}
              className="no-drag w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              {t("loaderLabelUpper")}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PACK_LOADERS.map(({ id, label }) => {
                const active = loader === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setLoader(id)}
                    className={`no-drag flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]"
                        : "border-white/10 bg-[#0a0a0f] text-text-secondary hover:border-white/20 hover:text-text-primary"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        active ? "bg-[var(--accent)]/20" : "bg-white/5"
                      }`}
                    >
                      <LoaderIcon loader={id as LoaderIconId} size={28} />
                    </span>
                    <span className="text-center leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              {t("minecraftVersionLabelUpper")}
            </p>
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin-slow text-[var(--accent)]" />
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto rounded-xl border border-white/10 bg-[#0a0a0f] p-2">
                <div className="flex flex-wrap gap-1.5">
                  {versionList.map((v) => {
                    const active = mcVersion === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setMcVersion(v.id)}
                        className={`no-drag rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          active
                            ? "bg-[var(--accent)] text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]"
                            : "bg-white/5 text-text-secondary hover:bg-white/10 hover:text-text-primary"
                        }`}
                      >
                        {v.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 border-t border-white/8 px-6 py-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="no-drag flex-1 rounded-xl border border-white/10 bg-[#0a0a0f] py-3 text-sm font-medium text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="no-drag flex-1 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.45)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {t("create")}
          </button>
        </div>
      </div>
    </div>
  );
}
