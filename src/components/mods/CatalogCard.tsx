import { Download, Star } from "lucide-react";
import type { CatalogItem } from "../../types/mods";
import { formatDownloads, formatDownloadsFull } from "../../utils/format";
import { t } from "../../i18n";

interface CatalogCardProps {
  item: CatalogItem;
  onOpen: () => void;
}

export function CatalogCard({ item, onOpen }: CatalogCardProps) {
  const tag = item.categories[0]?.toLowerCase() ?? item.kind;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="no-drag group flex flex-col overflow-hidden rounded-xl border border-border bg-bg-card text-left transition hover:border-[var(--accent)]/40 hover:shadow-lg hover:shadow-black/20"
    >
      <div className="relative h-36 overflow-hidden bg-bg-elevated">
        {item.bannerUrl ? (
          <img
            src={item.bannerUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : item.iconUrl ? (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-bg-elevated to-bg-card">
            <img
              src={item.iconUrl}
              alt=""
              className="h-20 w-20 rounded-xl object-cover"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--accent)]/20 to-bg-elevated text-4xl font-bold text-text-muted">
            {item.title.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium capitalize text-text-secondary backdrop-blur-sm">
          {item.source === "curseforge" ? "CurseForge" : "Modrinth"}
        </span>
        <span className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium capitalize text-text-secondary backdrop-blur-sm">
          {tag}
        </span>
        {item.categories.length > 1 && (
          <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
            {item.categories.slice(1, 3).map((cat) => (
              <span
                key={cat}
                className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] capitalize text-text-secondary backdrop-blur-sm"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold text-text-primary group-hover:text-[var(--accent)]">
          {item.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
          {item.author}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400/80 text-amber-400/80" />
            {formatDownloads(item.follows)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Download className="h-3.5 w-3.5 text-text-muted" />
            {formatDownloadsFull(item.downloads)}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-text-muted">
          {item.description}
        </p>
        <span className="mt-3 text-xs font-medium text-[var(--accent)] opacity-0 transition group-hover:opacity-100">
          {t("catalogOpenDetail")} →
        </span>
      </div>
    </button>
  );
}
