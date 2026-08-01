import { useEffect } from "react";
import {
  fetchFriends,
  getOrCreateQuickSession,
  handleSocialApiError,
  sendPresence,
} from "../services/nuvoxelApi";
import { useAppStore } from "../store/useAppStore";

const SYNC_MS = 20_000;

export function useFriendsSync() {
  const session = useAppStore((s) => s.nuvoxelSession);
  const accounts = useAppStore((s) => s.accounts);
  const activeAccountId = useAppStore((s) => s.activeAccountId);
  const gameRunning = useAppStore((s) => s.gameRunning);
  const gameVersion = useAppStore((s) => s.gameVersion);
  const socialApiUrl = useAppStore((s) => s.socialApiUrl);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

  useEffect(() => {
    let cancelled = false;

    const restoreSessionIfNeeded = async () => {
      if (!session && activeAccount?.username) {
        try {
          const newSession = await getOrCreateQuickSession(activeAccount.username);
          if (!cancelled) {
            useAppStore.setState({ nuvoxelSession: newSession });
          }
          return newSession;
        } catch {
          return null;
        }
      }
      return session;
    };

    const sync = async () => {
      const currentSession = session || (await restoreSessionIfNeeded());
      if (!currentSession) {
        if (!cancelled) {
          useAppStore.setState({ friends: [], socialApiOnline: false });
        }
        return;
      }

      const status = gameRunning
        ? `playing Minecraft ${gameVersion}`
        : "online";

      try {
        await sendPresence(currentSession.token, status);
      } catch (e) {
        if (activeAccount?.username) {
          try {
            const restored = await getOrCreateQuickSession(activeAccount.username);
            if (!cancelled) {
              useAppStore.setState({ nuvoxelSession: restored });
            }
          } catch {
            handleSocialApiError(e);
          }
        } else {
          handleSocialApiError(e);
        }
      }

      try {
        const friends = await fetchFriends(currentSession.token);
        if (!cancelled) {
          useAppStore.setState({ friends, socialApiOnline: true });
        }
      } catch (e) {
        if (!cancelled) {
          useAppStore.setState({ friends: [], socialApiOnline: false });
        }
      }
    };

    void sync();
    const timer = setInterval(() => void sync(), SYNC_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [session, activeAccountId, gameRunning, gameVersion, socialApiUrl]);
}
