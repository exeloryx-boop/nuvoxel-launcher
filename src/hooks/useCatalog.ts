import { useCallback, useEffect, useState } from "react";
import type { CatalogItem, CatalogSort } from "../types/mods";
import type { CatalogKind } from "../types";
import type { CatalogSource } from "../types/mods";
import { searchModrinth } from "../services/modrinth";
import {
  checkCurseForgeAvailable,
  searchCurseForge,
} from "../services/curseforge";
import { translateCatalogError } from "../utils/catalogErrors";

export function useCatalog(
  source: CatalogSource,
  kind: CatalogKind,
  query: string,
  enabled: boolean,
  sort: CatalogSort = "downloads",
) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchPage = useCallback(
    async (pageOffset: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        if (source === "curseforge" && !(await checkCurseForgeAvailable())) {
          throw new Error("CURSEFORGE_NO_KEY");
        }

        const result =
          source === "modrinth"
            ? await searchModrinth(query, kind, pageOffset, 24, sort)
            : await searchCurseForge(query, kind, pageOffset, 24);

        setItems((prev) => (append ? [...prev, ...result.items] : result.items));
        setTotal(result.total);
        setOffset(pageOffset);
      } catch (e) {
        setError(translateCatalogError(e));
        if (!append) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [source, kind, query, sort],
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) fetchPage(0, false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, fetchPage]);

  const loadMore = () => {
    const next =
      source === "modrinth" ? offset + 24 : offset + 24;
    fetchPage(next, true);
  };

  return {
    items,
    total,
    loading,
    error,
    loadMore,
    hasMore: items.length < total,
  };
}
