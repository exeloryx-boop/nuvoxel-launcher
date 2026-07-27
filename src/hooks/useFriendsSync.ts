import { useEffect } from "react";
import {
  fetchFriends,
  handleSocialApiError,
  sendPresence,
} from "../services/nuvoxelApi";
import { useAppStore } from "../store/useAppStore";

const SYNC_MS = 20_000;

export function useFriendsSync() {
  const session = useAppStore((s) => s.nuvoxelSession);
  const gameRunning = useAppStore((s) => s.gameRunning);
  const gameVersion = useAppStore((s) => s.gameVersion);
  const socialApiUrl = useAppStore((s) => s.socialApiUrl);

  useEffect(() => {
    if (!session) {
      useAppStore.setState({ friends: [], socialApiOnline: false });
      return;
    }

    let cancelled = false;

    const sync = async () => {
      const status = gameRunning
        ? `playing Minecraft ${gameVersion}`
        : "online";

      try {
        await sendPresence(session.token, status);
      } catch (e) {
        if (handleSocialApiError(e)) return;
      }

      try {
        const friends = await fetchFriends(session.token);
        if (!cancelled) {
          useAppStore.setState({ friends, socialApiOnline: true });
        }
      } catch (e) {
        if (handleSocialApiError(e)) return;
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
  }, [session, gameRunning, gameVersion, socialApiUrl]);
}
