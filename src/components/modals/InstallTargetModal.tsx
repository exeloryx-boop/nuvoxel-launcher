import { useMemo, useState, useEffect } from "react";
import { Check, Loader2, Package, Plus } from "lucide-react";
import { Modal } from "../ui/Modal";
import { LoaderIcon } from "../ui/LoaderIcon";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { packCompatibleWithInstall } from "../../services/modUpdates";
import type { CatalogItem, ModLoader } from "../../types/mods";
import { MOD_LOADERS } from "../../types/mods";

export interface InstallTargetChoice {
  mode: "new" | "existing";
  packId?: string;
  packName?: string;
}

interface InstallTargetModalProps {
  open: boolean;
  item: CatalogItem | null;
  versionId: string | null;
  mcVersion: string;
  loader: ModLoader;
  installing?: boolean;
  onClose: () => void;
  onConfirm: (choice: InstallTargetChoice) => void;
}

export function InstallTargetModal({
  open,
  item,
  versionId,
  mcVersion,
  loader,
  installing = false,
  onClose,
  onConfirm,
}: InstallTargetModalProps) {
  const modPacks = useAppStore((s) => s.modPacks);
  const isModpack = item?.kind === "modpack";

  const [mode, setMode] = useState<"new" | "existing">("new");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [packName, setPackName] = useState("");

  const compatiblePacks = useMemo(() => {
    if (!item || isModpack) return [];
    return modPacks.filter((pack) => {
      const hasMod = (pack.mods ?? []).some((m) => m.projectId === item.id);
      if (hasMod) return false;
      return packCompatibleWithInstall(pack, mcVersion, loader);
    });
  }, [modPacks, item, isModpack, mcVersion, loader]);

  const loaderLabel =
    MOD_LOADERS.find((l) => l.id === loader)?.label ?? loader;

  const defaultName = item?.title ?? t("createPack");

  useEffect(() => {
    if (!open || !item) return;
    setPackName(item.title);
    if (compatiblePacks.length > 0) {
      setMode("existing");
      setSelectedPackId((prev) =>
        prev && compatiblePacks.some((p) => p.id === prev)
          ? prev
          : (compatiblePacks[0]?.id ?? null),
      );
    } else {
      setMode("new");
      setSelectedPackId(null);
    }
  }, [open, item?.id, compatiblePacks]);

  if (!item || !versionId) return null;

  const canConfirm =
    !installing &&
    (isModpack ||
      (mode === "new" && (packName.trim() || defaultName)) ||
      (mode === "existing" && selectedPackId));

  return (
    <Modal open={open} onClose={onClose} title={t("installTargetTitle")} size="md">
      <div className="space-y-5 p-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated/60 p-3">
          {item.iconUrl ? (
            <img
              src={item.iconUrl}
              alt=""
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-card">
              <Package className="h-6 w-6 text-text-muted" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-text-primary">
              {item.title}
            </p>
            <p className="text-xs text-text-muted">
              {loaderLabel} · {mcVersion}
            </p>
          </div>
        </div>

        {isModpack ? (
          <p className="text-sm text-text-secondary">{t("installTargetModpackNote")}</p>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`no-drag flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  mode === "new"
                    ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "border-border text-text-secondary hover:bg-white/5"
                }`}
              >
                <Plus className="h-4 w-4" />
                {t("installTargetNewPack")}
              </button>
              <button
                type="button"
                onClick={() => setMode("existing")}
                disabled={compatiblePacks.length === 0}
                className={`no-drag flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:opacity-40 ${
                  mode === "existing"
                    ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "border-border text-text-secondary hover:bg-white/5"
                }`}
              >
                <Package className="h-4 w-4" />
                {t("installTargetExisting")}
              </button>
            </div>

            {mode === "new" ? (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  {t("installTargetPackName")}
                </label>
                <input
                  type="text"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  placeholder={defaultName}
                  className="no-drag w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
            ) : compatiblePacks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-text-muted">
                {t("installTargetNoPacks")}
              </p>
            ) : (
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {compatiblePacks.map((pack) => {
                  const selected = selectedPackId === pack.id;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setSelectedPackId(pack.id)}
                      className={`no-drag flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)]/10"
                          : "border-border bg-bg-card hover:border-white/15"
                      }`}
                    >
                      <LoaderIcon loader={pack.loader} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-text-primary">
                          {pack.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {MOD_LOADERS.find((l) => l.id === pack.loader)?.label} ·{" "}
                          {pack.minecraftVersion} ·{" "}
                          {t("packModCount").replace(
                            "{n}",
                            String(pack.mods?.length ?? 0),
                          )}
                        </p>
                      </div>
                      {selected ? (
                        <Check className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="no-drag rounded-xl border border-border px-5 py-2.5 text-sm text-text-secondary transition hover:bg-white/5"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (isModpack) {
                onConfirm({ mode: "new", packName: item.title });
                return;
              }
              if (mode === "existing" && selectedPackId) {
                onConfirm({ mode: "existing", packId: selectedPackId });
                return;
              }
              onConfirm({
                mode: "new",
                packName: packName.trim() || defaultName,
              });
            }}
            className="no-drag flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {installing ? (
              <Loader2 className="h-4 w-4 animate-spin-slow" />
            ) : (
              t("installTargetConfirm")
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
