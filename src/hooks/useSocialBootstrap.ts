import { useEffect } from "react";
import {
  checkSocialApiHealth,
  fetchMe,
  getOrCreateQuickSession,
  handleSocialApiError,
} from "../services/nuvoxelApi";
import { SocialApiError } from "../types/social";
import { useAppStore } from "../store/useAppStore";

export function useSocialBootstrap() {
  const session = useAppStore((s) => s.nuvoxelSession);
  const socialApiUrl = useAppStore((s) => s.socialApiUrl);
  const activeAccountId = useAppStore((s) => s.activeAccountId);
  const accounts = useAppStore((s) => s.accounts);
  const refreshFriends = useAppStore((s) => s.refreshFriends);
  const setSocialApiOnline = useAppStore((s) => s.setSocialApiOnline);

  useEffect(() => {
    void (async () => {
      const online = await checkSocialApiHealth();
      setSocialApiOnline(online);
    })();
  }, [socialApiUrl, setSocialApiOnline]);

  useEffect(() => {
    const activeAccount =
      accounts.find((a) => a.id === activeAccountId) ||
      accounts[0];

    void (async () => {
      if (session?.token) {
        try {
          await fetchMe(session.token);
          await refreshFriends();
          return;
        } catch (e) {
          if (e instanceof SocialApiError && e.code === "UNAUTHORIZED" && activeAccount?.username) {
            try {
              const restored = await getOrCreateQuickSession(activeAccount.username);
              useAppStore.setState({ nuvoxelSession: restored });
              await refreshFriends();
              return;
            } catch {
              /* ignore fallback */
            }
          }
          if (!handleSocialApiError(e)) {
            useAppStore.setState({ socialApiOnline: false, friends: [] });
          }
        }
      } else if (activeAccount?.username) {
        try {
          const newSession = await getOrCreateQuickSession(activeAccount.username);
          useAppStore.setState({ nuvoxelSession: newSession });
          await refreshFriends();
        } catch {
          /* offline or error */
        }
      }
    })();
  }, [session?.token, socialApiUrl, activeAccountId, accounts, refreshFriends]);
}
