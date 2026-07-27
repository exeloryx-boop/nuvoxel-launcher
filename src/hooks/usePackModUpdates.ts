import { useCallback, useEffect, useState } from "react";
import type { ModPack } from "../types/mods";
import {
  checkPackModUpdates,
  type ModUpdateInfo,
} from "../services/modUpdates";

export function usePackModUpdates(pack: ModPack | undefined) {
  const [updates, setUpdates] = useState<Map<string, ModUpdateInfo>>(
    new Map(),
  );
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    if (!pack) {
      setUpdates(new Map());
      return;
    }
    setChecking(true);
    try {
      const map = await checkPackModUpdates(pack);
      setUpdates(map);
    } finally {
      setChecking(false);
    }
  }, [pack]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    updates,
    checking,
    refresh,
    updateCount: updates.size,
  };
}
