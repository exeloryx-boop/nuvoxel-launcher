import { useState, useEffect, useRef } from "react";
import { X, Send, Globe, MessageSquare } from "lucide-react";
import { ChatMessage, FriendProfile } from "../../types/social";
import { fetchGlobalChat, fetchDMChat, getOrCreateQuickSession, handleSocialApiError, sendChatMessage } from "../../services/nuvoxelApi";
import { SocialApiError } from "../../types/social";
import { useAppStore } from "../../store/useAppStore";
import { UserProfileModal } from "./UserProfileModal";

interface ChatModalProps {
  onClose: () => void;
  initialDMTarget?: FriendProfile | null;
}

export function ChatModal({ onClose, initialDMTarget }: ChatModalProps) {
  const session = useAppStore((s) => s.nuvoxelSession);
  const friends = useAppStore((s) => s.friends);

  const [activeTab, setActiveTab] = useState<"global" | "dm">(initialDMTarget ? "dm" : "global");
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(initialDMTarget || friends[0] || null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      if (activeTab === "global") {
        const data = await fetchGlobalChat();
        setMessages(data);
      } else if (activeTab === "dm" && selectedFriend && session) {
        const data = await fetchDMChat(session.token, selectedFriend.id);
        setMessages(data);
      }
    } catch {
      /* ignore poll errors */
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeTab, selectedFriend, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    const accounts = useAppStore.getState().accounts;
    const activeAccountId = useAppStore.getState().activeAccountId;
    const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];

    let currentSession = session;
    if (!currentSession && activeAccount?.username) {
      try {
        currentSession = await getOrCreateQuickSession(activeAccount.username);
        useAppStore.setState({ nuvoxelSession: currentSession });
      } catch {
        /* failed to auto-session */
      }
    }

    if (!currentSession) {
      setError("Увійдіть в акаунт, щоб писати в чат.");
      return;
    }

    setSending(true);
    setError("");
    const content = text.trim();
    setText("");

    try {
      if (activeTab === "global") {
        const msg = await sendChatMessage(currentSession.token, content, "global");
        setMessages((prev) => [...prev, msg]);
      } else if (activeTab === "dm" && selectedFriend) {
        const msg = await sendChatMessage(currentSession.token, content, "dm", selectedFriend.id);
        setMessages((prev) => [...prev, msg]);
      }
    } catch (error) {
      if (error instanceof SocialApiError && error.code === "UNAUTHORIZED" && activeAccount?.username) {
        try {
          const restoredSession = await getOrCreateQuickSession(activeAccount.username);
          useAppStore.setState({ nuvoxelSession: restoredSession });
          if (activeTab === "global") {
            const msg = await sendChatMessage(restoredSession.token, content, "global");
            setMessages((prev) => [...prev, msg]);
          } else if (activeTab === "dm" && selectedFriend) {
            const msg = await sendChatMessage(restoredSession.token, content, "dm", selectedFriend.id);
            setMessages((prev) => [...prev, msg]);
          }
          return;
        } catch {
          /* fallback */
        }
      }

      handleSocialApiError(error);
      if (error instanceof SocialApiError) {
        setError(
          error.code === "USER_MUTED"
            ? "Вам тимчасово заборонено писати в чат."
            : error.code === "USER_BANNED"
              ? "Ваш акаунт заблоковано."
              : error.code === "UNAUTHORIZED"
                ? "Сесію оновлено. Натисніть надіслати ще раз."
                : "Повідомлення не надіслано. Спробуйте ще раз.",
        );
      } else {
        setError("Не вдалося підключитися до чату. Спробуйте ще раз.");
      }
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
        <div className="relative flex h-[600px] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl animate-scale-in">
          {/* Sidebar */}
          <div className="flex w-64 flex-col border-r border-white/10 bg-black/30">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" /> Чат спільноти
              </h3>
            </div>

            {/* Channels */}
            <div className="p-2 space-y-1">
              <button
                onClick={() => setActiveTab("global")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activeTab === "global"
                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Globe className="h-4 w-4" /> Глобальний чат
              </button>

              <div className="pt-3 pb-1 px-3 text-[11px] font-bold uppercase text-zinc-500 tracking-wider">
                Особисті повідомлення
              </div>

              {friends.length === 0 ? (
                <p className="px-3 py-2 text-xs text-zinc-600">Немає доданих друзів</p>
              ) : (
                friends.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFriend(f);
                      setActiveTab("dm");
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                      activeTab === "dm" && selectedFriend?.id === f.id
                        ? "bg-white/15 text-white font-semibold"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={`https://crafthead.net/avatar/${encodeURIComponent(f.username)}/24`}
                        alt=""
                        className="h-6 w-6 rounded-lg border border-white/10"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black ${
                          f.online ? "bg-emerald-400" : "bg-zinc-600"
                        }`}
                      />
                    </div>
                    <span className="truncate">{f.username}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Chat Content */}
          <div className="flex flex-1 flex-col bg-[#12121a]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                {activeTab === "global" ? (
                  <>
                    <div className="rounded-lg bg-accent/10 p-2 text-accent">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Глобальний чат</h4>
                      <p className="text-xs text-zinc-400">Спілкуйся з усіма гравцями Nuvoxel</p>
                    </div>
                  </>
                ) : selectedFriend ? (
                  <>
                    <img
                      src={`https://crafthead.net/avatar/${encodeURIComponent(selectedFriend.username)}/32`}
                      alt=""
                      className="h-8 w-8 rounded-lg border border-white/10"
                    />
                    <div>
                      <h4 className="font-bold text-white">{selectedFriend.username}</h4>
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {selectedFriend.online ? "Онлайн" : "Офлайн"}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-zinc-400">Виберіть друга для чату</p>
                )}
              </div>

              <button
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                  <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">Повідомлень поки що немає</p>
                  <p className="text-xs text-zinc-600 mt-1">Напишіть першим!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = session?.userId === m.userId;
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <button
                        onClick={() => setSelectedUserId(m.userId)}
                        className="transition hover:scale-105 shrink-0"
                        title="Переглянути профіль"
                      >
                        <img
                          src={`https://crafthead.net/avatar/${encodeURIComponent(m.username)}/32`}
                          alt=""
                          className="h-8 w-8 rounded-xl border border-white/10"
                        />
                      </button>

                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? "bg-accent text-white shadow-md shadow-accent/10"
                            : "bg-white/5 text-zinc-200 border border-white/5"
                        }`}
                      >
                        {!isMe && (
                          <button
                            onClick={() => setSelectedUserId(m.userId)}
                            className="font-semibold text-accent text-xs hover:underline block mb-0.5"
                          >
                            {m.username}
                          </button>
                        )}
                        <p className="break-words leading-relaxed">{m.text}</p>
                        <span
                          className={`mt-1 block text-[10px] text-right ${
                            isMe ? "text-white/70" : "text-zinc-500"
                          }`}
                        >
                          {formatTime(m.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            {session ? (
              <form onSubmit={handleSend} className="border-t border-white/10 p-3">
                {error && <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
                <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    activeTab === "global"
                      ? "Повідомлення в глобальний чат..."
                      : `Повідомлення для ${selectedFriend?.username || ""}...`
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="rounded-xl bg-accent px-4 py-2.5 font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover disabled:opacity-50 transition"
                >
                  <Send className="h-4 w-4" />
                </button>
                </div>
              </form>
            ) : (
              <div className="border-t border-white/10 p-3 text-center text-xs text-zinc-500">
                Увійдіть в акаунт Nuvoxel ID, щоб писати в чат
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Modal when avatar/name is clicked */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onOpenDM={(friend) => {
            setSelectedFriend(friend);
            setActiveTab("dm");
          }}
        />
      )}
    </>
  );
}
