import { useEffect, useState } from "react";
import { Copy, X } from "lucide-react";
import { BlurOverlay } from "../ui/BlurOverlay";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { syncAchievements } from "../../store/achievementSync";
import { addFriendByCode } from "../../services/nuvoxelApi";
import { friendErrorToast } from "../../utils/socialErrors";
import { SocialApiError } from "../../types/social";

export function AddFriendModal() {
  const open = useAppStore((s) => s.showAddFriendModal);
  const setOpen = useAppStore((s) => s.setShowAddFriendModal);
  const session = useAppStore((s) => s.nuvoxelSession);
  const showToast = useAppStore((s) => s.showToast);
  const refreshFriends = useAppStore((s) => s.refreshFriends);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      setCode("");
      setCopied(false);
    }
  }, [open]);

  if (!open) return null;

  const handleAdd = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      if (session) {
        await addFriendByCode(session.token, trimmed.toUpperCase());
        await refreshFriends();
      } else {
        const added = useAppStore.getState().addLocalFriend(trimmed);
        if (!added) {
          setLoading(false);
          return;
        }
      }
      syncAchievements(useAppStore.getState, useAppStore.setState, (stats) => ({
        ...stats,
        friendsAccepted: stats.friendsAccepted + 1,
      }));
      setOpen(false);
    } catch (e) {
      const key =
        e instanceof SocialApiError
          ? friendErrorToast(e.code)
          : "friendAddError";
      showToast(key);
      setTimeout(() => useAppStore.setState({ toastMessage: null }), 2500);
    } finally {
      setLoading(false);
    }
  };

  const copyMyCode = async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <BlurOverlay
      open={open}
      onClose={() => setOpen(false)}
      className="items-center justify-center px-4"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">{t("addFriendTitle")}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-text-muted hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {session ? (
            <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3">
              <p className="mb-1 text-xs text-text-muted">{t("friendCode")}</p>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xl font-bold tracking-widest text-[var(--accent)]">
                  {session.friendCode}
                </span>
                <button
                  type="button"
                  onClick={() => void copyMyCode()}
                  className="no-drag flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:bg-white/5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? t("friendCodeCopied") : t("copyLabel")}
                </button>
              </div>
              <p className="mt-2 text-xs text-text-muted">{t("friendCodeHint")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3">
              <p className="text-xs text-[var(--accent)]">
                {t("addLocalFriendHint") || "Додайте друга за нікнеймом або кодом"}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">
              {session ? t("addFriendHint") : (t("enterFriendNicknameOrCode") || "Введіть нікнейм або код друга")}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={session ? "ABC123" : "Steve"}
              maxLength={session ? 6 : 24}
              className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 font-mono text-lg tracking-wider outline-none focus:border-[var(--accent)]"
            />
          </div>

          <button
            type="button"
            disabled={loading || !code.trim()}
            onClick={() => void handleAdd()}
            className="no-drag w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {t("addFriend")}
          </button>
        </div>
      </div>
    </BlurOverlay>
  );
}
