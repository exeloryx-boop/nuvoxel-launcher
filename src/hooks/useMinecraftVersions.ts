import { useEffect, useState } from "react";
import type { MinecraftVersionEntry } from "../types/mods";
import { fetchMinecraftVersions } from "../services/minecraftVersions";

export function useMinecraftVersions() {
  const [versions, setVersions] = useState<MinecraftVersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = () => {
    setLoading(true);
    setError(null);
    return fetchMinecraftVersions()
      .then((v) => setVersions(v))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    fetchMinecraftVersions()
      .then((v) => {
        if (!cancelled) setVersions(v);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { versions, loading, error, refetch };
}
