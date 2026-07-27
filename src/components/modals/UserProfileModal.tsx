import { useState, useEffect } from "react";
import { X, UserPlus, MessageSquare, Check, Shield, Clock } from "lucide-react";
import { FriendProfile } from "../../types/social";
import { addFriendByCode, fetchUserProfile } from "../../services/nuvoxelApi";
import { useAppStore } from "../../store/useAppStore";

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
  onOpenDM?: (friend: FriendProfile) => void;
}

export function UserProfileModal({ userId, onClose, onOpenDM }: UserProfileModalProps) {
  const session = useAppStore((s) => s.nuvoxelSession);
  const friends = useAppStore((s) => s.friends);
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const isAlreadyFriend = friends.some((f) => f.id === userId);
  const isSelf = session?.userId === userId;

  useEffect(() => {
    fetchUserProfile(userId)
      .then((data) => setProfile(data))
      .catch(() => setError("Не вдалося завантажити профіль"))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAddFriend = async () => {
    if (!session || !profile?.friendCode) return;
    setAdding(true);
    setError("");
    try {
      await addFriendByCode(session.token, profile.friendCode);
      setAdded(true);
      useAppStore.getState().refreshFriends();
    } catch (e: any) {
      setError(e?.message === "ALREADY_FRIENDS" ? "Вже у друзях" : "Не вдалося додати");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex py-12 items-center justify-center text-zinc-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <img
                src={`https://crafthead.net/avatar/${encodeURIComponent(profile.username)}/96`}
                alt={profile.username}
                className="h-24 w-24 rounded-2xl border-2 border-accent/40 bg-black/40 shadow-xl"
              />
              <span
                className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-[#12121a] ${
                  profile.online ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                }`}
              />
            </div>

            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              {profile.username}
              {profile.username.toLowerCase() === "admin" && (
                <Shield className="h-5 w-5 text-purple-400" />
              )}
            </h3>

            {profile.friendCode && (
              <span className="mt-1 rounded-full bg-accent/10 px-3 py-1 font-mono text-xs font-semibold text-accent border border-accent/20">
                Код: {profile.friendCode}
              </span>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{profile.online ? profile.status || "Онлайн в групі" : "Офлайн"}</span>
            </div>

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            {!isSelf && (
              <div className="mt-6 flex w-full gap-3">
                {isAlreadyFriend || added ? (
                  <button
                    disabled
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/20 py-3 text-sm font-semibold text-emerald-300 border border-emerald-500/30"
                  >
                    <Check className="h-4 w-4" /> Вже у друзях
                  </button>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    disabled={adding}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover transition"
                  >
                    <UserPlus className="h-4 w-4" /> {adding ? "Додавання..." : "Додати у друзі"}
                  </button>
                )}

                {onOpenDM && (
                  <button
                    onClick={() => {
                      onOpenDM(profile);
                      onClose();
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10 transition"
                  >
                    <MessageSquare className="h-4 w-4" /> Написати
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-red-400">{error || "Користувача не знайдено"}</p>
        )}
      </div>
    </div>
  );
}
