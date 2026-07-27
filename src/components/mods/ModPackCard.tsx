import { Download, Trash2 } from "lucide-react";

import type { ModPack } from "../../types/mods";

import { MOD_LOADERS } from "../../types/mods";

import { LoaderIcon } from "../ui/LoaderIcon";

import { t } from "../../i18n";



interface ModPackCardProps {

  pack: ModPack;

  active?: boolean;

  onSelect?: () => void;

  onRemove?: () => void;

}



export function ModPackCard({

  pack,

  active = false,

  onSelect,

  onRemove,

}: ModPackCardProps) {

  const loaderLabel =

    MOD_LOADERS.find((l) => l.id === pack.loader)?.label ?? pack.loader;



  return (

    <div

      role="button"

      tabIndex={0}

      onClick={onSelect}

      onKeyDown={(e) => {

        if (e.key === "Enter" || e.key === " ") {

          e.preventDefault();

          onSelect?.();

        }

      }}

      className={`no-drag group relative flex w-56 cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition ${

        active

          ? "border-[var(--accent)] bg-[var(--accent)]/10"

          : "border-border bg-bg-card hover:border-white/15"

      }`}

    >

      <div className="flex h-28 items-center justify-center bg-bg-elevated">

        {pack.modrinthIconUrl ? (

          <img

            src={pack.modrinthIconUrl}

            alt=""

            className="h-16 w-16 rounded-lg object-cover"

          />

        ) : pack.curseforgeIconUrl ? (

          <img

            src={pack.curseforgeIconUrl}

            alt=""

            className="h-16 w-16 rounded-lg object-cover"

          />

        ) : (

          <LoaderIcon loader={pack.loader} size={48} />

        )}

      </div>

      <div className="p-3">

        <p className="truncate font-medium text-text-primary">{pack.name}</p>

        <p className="mt-1 text-xs text-text-muted">

          {pack.minecraftVersion} · {loaderLabel}

          {(pack.mods?.length ?? pack.modCount ?? 0) > 0 && (
            <>
              {" · "}
              {t("packModCount", {
                n: pack.mods?.length ?? pack.modCount ?? 0,
              })}
            </>
          )}

        </p>

        {(pack.modrinthProjectId || pack.curseforgeProjectId) && (

          <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-green-400">

            <Download className="h-3 w-3" />

            {pack.source === "curseforge" ? "CurseForge" : "Modrinth"}

          </span>

        )}

      </div>

      {onRemove && (

        <button

          type="button"

          onClick={(e) => {

            e.stopPropagation();

            onRemove();

          }}

          className="no-drag absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs text-text-secondary opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"

        >

          <Trash2 className="h-3 w-3" />

          {t("delete")}

        </button>

      )}

    </div>

  );

}

