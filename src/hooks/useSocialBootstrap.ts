import { useEffect } from "react";
import {
  checkSocialApiHealth,
  fetchMe,
  handleSocialApiError,
} from "../services/nuvoxelApi";
import { useAppStore } from "../store/useAppStore";

export function useSocialBootstrap() {
  const session = useAppStore((s) => s.nuvoxelSession);
  const socialApiUrl = useAppStore((s) => s.socialApiUrl);
  const refreshFriends = useAppStore((s) => s.refreshFriends);
  const setSocialApiOnline = useAppStore((s) => s.setSocialApiOnline);

  useEffect(() => {
    void (async () => {
      const online = await checkSocialApiHealth();
      setSocialApiOnline(online);
    })();
  }, [socialApiUrl, setSocialApiOnline]);

  useEffect(() => {
    if (!session) return;

    void (async () => {
      try {
        await fetchMe(session.token);
        await refreshFriends();
      } catch (e) {
        if (!handleSocialApiError(e)) {
          useAppStore.setState({ socialApiOnline: false, friends: [] });
        }
      }
    })();
  }, [session?.token, socialApiUrl, refreshFriends]);
}
