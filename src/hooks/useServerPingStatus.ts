import { useEffect, useState } from "react";
import type { GameServer } from "../types";
import { pingServer } from "../services/serverPing";

export type ServerPingState = {
  loading: boolean;
  online?: boolean;
  players?: number;
  maxPlayers?: number;
  motd?: string;
};

export function useServerPingStatus(servers: GameServer[]) {
  const [statusMap, setStatusMap] = useState<Record<string, ServerPingState>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      for (const srv of servers) {
        if (cancelled) return;
        setStatusMap((m) => ({ ...m, [srv.id]: { loading: true } }));
        const st = await pingServer(srv.address, srv.port);
        if (cancelled) return;
        setStatusMap((m) => ({
          ...m,
          [srv.id]: {
            loading: false,
            online: st.online,
            players: st.players,
            maxPlayers: st.maxPlayers,
            motd: st.motd,
          },
        }));
      }
    };

    if (servers.length) void load();
    else setStatusMap({});

    return () => {
      cancelled = true;
    };
  }, [servers]);

  const refresh = async () => {
    for (const srv of servers) {
      setStatusMap((m) => ({ ...m, [srv.id]: { loading: true } }));
      const st = await pingServer(srv.address, srv.port);
      setStatusMap((m) => ({
        ...m,
        [srv.id]: {
          loading: false,
          online: st.online,
          players: st.players,
          maxPlayers: st.maxPlayers,
          motd: st.motd,
        },
      }));
    }
  };

  return { statusMap, refresh };
}
