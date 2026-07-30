import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  Trash2,
  RefreshCw,
  Search,
  Activity,
  Server,
  Key,
  CheckCircle2,
  MessageSquare,
  Gamepad2,
  AlertTriangle,
  VolumeX,
  Ban,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { useWebsiteStore } from "../store/useWebsiteStore";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  friendCode: string;
  role: "admin" | "user";
  createdAt: number;
  lastSeenAt: number;
  online: boolean;
  status: string;
  friendsCount: number;
  bannedUntil?: number | null;
  mutedUntil?: number | null;
  banReason?: string;
  muteReason?: string;
}

interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  totalFriendships: number;
  uptimeSeconds: number;
  dbSize: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  channel: string;
  recipientId?: string;
  timestamp: number;
  flagged?: boolean;
}

interface Violation {
  id: string;
  userId: string;
  username: string;
  text: string;
  words: string[];
  channel: string;
  timestamp: number;
  resolved: boolean;
}

interface SharedPack {
  id: string;
  code: string;
  name: string;
  description: string;
  minecraftVersion: string;
  loader: string;
  modCount: number;
  authorUsername: string;
  status: "pending" | "approved" | "blocked";
  createdAt: number;
  reviewReason: string | null;
  mods?: { name: string; projectId: string; versionId: string; catalogSource: string }[];
}

const getApiBase = () => {
  if (typeof window !== "undefined" && window.location.origin) {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "https://nuvoxel-launcher.onrender.com";
    }
    return window.location.origin;
  }
  return "https://nuvoxel-launcher.onrender.com";
};

type Tab = "overview" | "users" | "launcher" | "claude" | "moderation";

export function AdminPage() {
  const auth = useWebsiteStore((s) => s.auth);
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [sharedPacks, setSharedPacks] = useState<SharedPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusMsg, setStatusMsg] = useState("");

  // Modals state
  const [modTargetUser, setModTargetUser] = useState<AdminUser | null>(null);
  const [banDuration, setBanDuration] = useState<number>(60); // minutes, -1 = perm, 0 = unban
  const [muteDuration, setMuteDuration] = useState<number>(30);
  const [modReason, setModReason] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiBase = getApiBase();
      const headers: Record<string, string> = {};
      if (auth?.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
      }
      const [statsRes, usersRes, chatRes, violRes, packsRes] = await Promise.all([
        fetch(`${apiBase}/admin/stats`, { headers }),
        fetch(`${apiBase}/admin/users`, { headers }),
        fetch(`${apiBase}/admin/chat`, { headers }),
        fetch(`${apiBase}/admin/violations`, { headers }),
        fetch(`${apiBase}/admin/claude/packs`, { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (chatRes.ok) setChatMessages(await chatRes.json());
      if (violRes.ok) setViolations(await violRes.json());
      if (packsRes.ok) setSharedPacks(await packsRes.json());
    } catch (e) {
      console.error("Admin fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [auth?.token]);

  const isAdmin = auth?.loggedIn && auth.role === "admin";
  if (!isAdmin) return <Navigate to="/login" replace />;

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await fetch(`${getApiBase()}/admin/users/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ userId, role: newRole }),
      });
      setStatusMsg(`Роль змінена на ${newRole.toUpperCase()}`);
    } catch {
      setStatusMsg("Помилка при зміні ролі");
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole as "admin" | "user" } : u)));
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Видалити користувача ${username}?`)) return;
    try {
      await fetch(`${getApiBase()}/admin/users/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ userId }),
      });
      setStatusMsg(`Користувача ${username} видалено`);
    } catch {
      setStatusMsg("Помилка при видаленні");
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleBan = async (userId: string, duration: number, reason: string) => {
    try {
      await fetch(`${getApiBase()}/admin/users/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ userId, duration, reason }),
      });
      const actionText = duration === 0 ? "розбанено" : duration === -1 ? "забанено назавжди" : `забанено на ${duration} хв`;
      setStatusMsg(`Користувача ${actionText}`);
      fetchData();
    } catch {
      setStatusMsg("Помилка виконання блокування");
    }
    setModTargetUser(null);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleMute = async (userId: string, duration: number, reason: string) => {
    try {
      await fetch(`${getApiBase()}/admin/users/mute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ userId, duration, reason }),
      });
      const actionText = duration === 0 ? "розмучено" : duration === -1 ? "замучено назавжди" : `замучено на ${duration} хв`;
      setStatusMsg(`Користувача ${actionText}`);
      fetchData();
    } catch {
      setStatusMsg("Помилка виконання муту");
    }
    setModTargetUser(null);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleResolveViolation = async (violationId: string) => {
    try {
      await fetch(`${getApiBase()}/admin/violations/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ violationId }),
      });
      setViolations((prev) => prev.map((v) => (v.id === violationId ? { ...v, resolved: true } : v)));
    } catch {
      /* ignore */
    }
  };

  const handlePackReview = async (
    packId: string,
    status: "approved" | "blocked",
  ) => {
    const reason = status === "blocked"
      ? window.prompt("Вкажіть причину блокування для автора:")?.trim()
      : "";
    if (status === "blocked" && !reason) return;
    try {
      const response = await fetch(`${getApiBase()}/admin/claude/packs/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ packId, status, reason }),
      });
      if (!response.ok) throw new Error("review failed");
      const updated = await response.json() as SharedPack;
      setSharedPacks((current) => current.map((pack) => pack.id === updated.id ? updated : pack));
      setStatusMsg(status === "approved" ? "Збірку схвалено" : "Збірку заблоковано, причину надіслано автору");
    } catch {
      setStatusMsg("Не вдалося оновити статус збірки");
    }
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.friendCode.toLowerCase().includes(q);
    const matchesRole = selectedRoleFilter === "all" || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const formatUptime = (sec: number) => `${Math.floor(sec / 3600)}г ${Math.floor((sec % 3600) / 60)}хв`;
  const formatTime = (ts: number) => new Date(ts).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const unresolvedViolationsCount = violations.filter((v) => !v.resolved).length;

  const tabs: { id: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { id: "claude", label: "Claude збірки", icon: Sparkles, badge: sharedPacks.filter((pack) => pack.status === "pending").length },
    { id: "overview", label: "Огляд", icon: Activity },
    { id: "users", label: "Користувачі", icon: Users },
    { id: "launcher", label: "Лаунчер & Чат", icon: Gamepad2 },
    { id: "moderation", label: "Модерація & Фільтр", icon: ShieldAlert, badge: unresolvedViolationsCount },
  ];

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Background ambient light */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-[var(--nl-green)] animate-float" />
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-shimmer">
              Панель Адміністратора
            </h1>
            <span className="rounded-full bg-[var(--nl-green)]/20 px-3 py-1 text-xs font-bold text-[var(--nl-green)] border border-[var(--nl-green)]/30 animate-pulse-glow">
              ADMIN ROLE
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">Wynsense Social Cloud & Launcher Moderation</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-outline btn-micro flex items-center gap-2 self-start py-2 text-sm sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Оновити дані
        </button>
      </div>

      {statusMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--nl-green)]/40 bg-[var(--nl-green)]/15 p-4 text-sm font-medium text-[var(--nl-green)] animate-bounce-in shadow-lg shadow-[var(--nl-green)]/10">
          <CheckCircle2 className="h-5 w-5 shrink-0 animate-scale-up" />
          {statusMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/50 p-2 backdrop-blur-xl animate-fade-up delay-100 shadow-xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn-micro relative flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-[var(--nl-green)] text-white shadow-lg shadow-[var(--nl-green)]/30"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.badge ? (
              <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white badge-danger">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === "overview" && (
        <div className="space-y-6 animate-slide-up-fade">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, label: "Усього гравців", value: stats?.totalUsers ?? "—", color: "purple" },
              { icon: UserCheck, label: "Зараз онлайн", value: stats?.onlineUsers ?? "—", color: "emerald" },
              { icon: Activity, label: "Зв'язків друзів", value: stats?.totalFriendships ?? "—", color: "blue" },
              { icon: Server, label: "Аптайм сервера", value: stats ? formatUptime(stats.uptimeSeconds) : "—", color: "amber" },
            ].map((card, i) => (
              <div
                key={card.label}
                className="glass-card glow-border hover-lift flex items-center gap-4 p-5 animate-fade-up"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className={`rounded-xl bg-${card.color}-500/10 p-3.5 text-${card.color}-400 border border-${card.color}-500/20 icon-glow`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-medium">{card.label}</p>
                  <p className="stat-number text-2xl font-bold mt-0.5">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Violations Alert Banner */}
          {unresolvedViolationsCount > 0 && (
            <div className="glass-card glow-border border-red-500/30 bg-red-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse-glow">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-400 shrink-0 animate-bounce-in" />
                <div>
                  <h4 className="font-bold text-red-300">Виявлено нецензурну лексику ({unresolvedViolationsCount})</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Система фільтрації зафіксувала нові порушення у чаті лаунчера</p>
                </div>
              </div>
              <button
                onClick={() => setTab("moderation")}
                className="btn-primary btn-micro bg-red-600 hover:bg-red-700 text-xs px-4 py-2"
              >
                Переглянути порушення
              </button>
            </div>
          )}

          {/* Quick Chat Activity Preview */}
          <div className="glass-card glow-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <MessageSquare className="h-5 w-5 text-[var(--nl-green)]" />
                Останні повідомлення чату
              </h3>
              <button onClick={() => setTab("launcher")} className="text-xs text-[var(--nl-green)] hover:underline font-semibold">
                Відкрити повний чат →
              </button>
            </div>
            {chatMessages.length === 0 ? (
              <p className="text-zinc-500 text-sm py-4 text-center">Повідомлення відсутні</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {chatMessages.slice(-8).reverse().map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 rounded-xl p-3 text-sm admin-row border border-white/5 ${
                      m.flagged ? "msg-flagged" : "bg-white/[.02]"
                    }`}
                  >
                    <img
                      src={`https://crafthead.net/avatar/${encodeURIComponent(m.username)}/28`}
                      alt=""
                      className="h-7 w-7 rounded-lg border border-white/10 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{m.username}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            m.channel === "dm" ? "bg-blue-500/20 text-blue-300" : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {m.channel === "dm" ? "Особисті" : "Загальний"}
                        </span>
                        {m.flagged && (
                          <span className="rounded-full bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold">
                            ⚠️ Мат
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-500 ml-auto">{formatTime(m.timestamp)}</span>
                      </div>
                      <p className="text-zinc-300 mt-1 break-words leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ USERS TAB ═══ */}
      {tab === "users" && (
        <div className="glass-card glow-border p-6 animate-slide-up-fade">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-[var(--nl-green)]" />
                Керування користувачами ({filteredUsers.length})
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Зміна ролей, блокування та мут гравців</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Пошук ніку, email або коду..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 rounded-xl border border-white/10 bg-black/40 pl-9 pr-4 py-2 text-sm outline-none focus:border-[var(--nl-green)] transition-all"
                />
              </div>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value as "all" | "admin" | "user")}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none text-zinc-300"
              >
                <option value="all">Усі ролі</option>
                <option value="admin">Адміністратори</option>
                <option value="user">Гравці</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-white/10 bg-white/5 text-xs text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Гравець</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Код</th>
                  <th className="px-4 py-3.5">Роль</th>
                  <th className="px-4 py-3.5">Статус</th>
                  <th className="px-4 py-3.5">Обмеження</th>
                  <th className="px-4 py-3.5 text-right">Дії модерації</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                      Користувачів не знайдено
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isBanned = u.bannedUntil && (u.bannedUntil === -1 || Date.now() < u.bannedUntil);
                    const isMuted = u.mutedUntil && (u.mutedUntil === -1 || Date.now() < u.mutedUntil);
                    return (
                      <tr key={u.id} className="admin-row">
                        <td className="px-4 py-3.5 font-semibold text-white flex items-center gap-3">
                          <img
                            src={`https://crafthead.net/avatar/${encodeURIComponent(u.username)}/32`}
                            alt=""
                            className="h-8 w-8 rounded-lg border border-white/10"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <span>{u.username}</span>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-400">{u.email}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-[var(--nl-green)]">{u.friendCode}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              u.role === "admin"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${u.online ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                            <span className="text-xs text-zinc-400">{u.online ? u.status || "Онлайн" : "Офлайн"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {isBanned && (
                              <span className="rounded-full bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                                <Ban className="h-3 w-3" /> Бан
                              </span>
                            )}
                            {isMuted && (
                              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                                <VolumeX className="h-3 w-3" /> Мут
                              </span>
                            )}
                            {!isBanned && !isMuted && <span className="text-xs text-zinc-600">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setModTargetUser(u)}
                              className="btn-micro rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300 hover:bg-amber-500/20"
                              title="Модерація (Бан/Мут)"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleRole(u.id, u.role)}
                              className="btn-micro rounded-lg border border-white/10 bg-black/30 p-2 text-xs hover:border-purple-500/50 hover:text-purple-400 transition"
                              title="Змінити роль"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="btn-micro rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400 hover:bg-red-500/20 transition"
                              title="Видалити"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ LAUNCHER & CHAT TAB ═══ */}
      {tab === "launcher" && (
        <div className="space-y-6 animate-slide-up-fade">
          {/* Launcher users detail grid */}
          <div className="glass-card glow-border p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
              <Gamepad2 className="h-5 w-5 text-[var(--nl-green)]" />
              Всі зареєстровані гравці лаунчера ({users.length})
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((u) => (
                <div key={u.id} className="glass-card p-4 flex flex-col justify-between hover-lift">
                  <div className="flex items-start gap-3">
                    <img
                      src={`https://crafthead.net/avatar/${encodeURIComponent(u.username)}/40`}
                      alt=""
                      className="h-10 w-10 rounded-xl border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold truncate text-white">{u.username}</span>
                        {u.online && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      <p className="text-xs text-zinc-400 font-mono text-[var(--nl-green)] mt-0.5">{u.friendCode}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-zinc-500">
                    <span>{u.friendsCount} друзів</span>
                    <button
                      onClick={() => setModTargetUser(u)}
                      className="text-[var(--nl-green)] hover:underline font-semibold flex items-center gap-1"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" /> Модерувати
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full chat log with Bad Word Highlights */}
          <div className="glass-card glow-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <MessageSquare className="h-5 w-5 text-[var(--nl-green)]" />
                Повний лог чату з розпізнаванням мату ({chatMessages.length})
              </h3>
            </div>
            {chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Немає повідомлень у чаті</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {chatMessages.slice().reverse().map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 rounded-xl p-3.5 text-sm admin-row border border-white/5 ${
                      m.flagged ? "msg-flagged" : "bg-white/[.02]"
                    }`}
                  >
                    <img
                      src={`https://crafthead.net/avatar/${encodeURIComponent(m.username)}/28`}
                      alt=""
                      className="h-8 w-8 rounded-lg shrink-0 border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{m.username}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            m.channel === "dm" ? "bg-blue-500/20 text-blue-300" : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {m.channel === "dm" ? "Особисті" : "Глобальний"}
                        </span>
                        {m.flagged && (
                          <span className="rounded-full bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold animate-pulse">
                            ⚠️ Нецензурна лексика
                          </span>
                        )}
                        <span className="text-xs text-zinc-500 ml-auto">{formatTime(m.timestamp)}</span>
                      </div>
                      <p className={`mt-1.5 break-words leading-relaxed ${m.flagged ? "text-red-200 font-medium" : "text-zinc-300"}`}>
                        {m.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODERATION & PROFANITY TAB ═══ */}
      {tab === "claude" && (
        <div className="space-y-5 animate-slide-up-fade">
          <div className="glass-card glow-border p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-white"><Sparkles className="h-5 w-5 text-violet-400" /> Claude збірки — черга перевірки</h3>
                <p className="mt-1 text-sm text-zinc-400">Схвалюйте сумісні збірки або блокуйте їх з обов'язковим поясненням для автора.</p>
              </div>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">Очікують: {sharedPacks.filter((pack) => pack.status === "pending").length}</span>
            </div>
            <div className="space-y-3">
              {sharedPacks.map((pack) => (
                <article key={pack.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-white">{pack.name}</h4><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${pack.status === "approved" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : pack.status === "blocked" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>{pack.status === "approved" ? "Схвалено" : pack.status === "blocked" ? "Заблоковано" : "На перевірці"}</span></div>
                      <p className="mt-1 text-xs text-zinc-400">Автор: {pack.authorUsername} · {pack.minecraftVersion} · {pack.loader} · {pack.modCount} модів · код {pack.code}</p>
                      {pack.description && <p className="mt-3 text-sm text-zinc-300">{pack.description}</p>}
                      <p className="mt-3 text-xs text-zinc-500">Моди: {(pack.mods ?? []).map((mod) => `${mod.name} (${mod.catalogSource})`).join(", ") || "без модів"}</p>
                      {pack.reviewReason && <p className="mt-2 text-xs text-red-300">Причина блокування: {pack.reviewReason}</p>}
                    </div>
                    {pack.status === "pending" && <div className="flex shrink-0 gap-2"><button type="button" onClick={() => void handlePackReview(pack.id, "approved")} className="btn-primary btn-micro bg-emerald-600 px-3 py-2 text-xs hover:bg-emerald-700">Схвалити</button><button type="button" onClick={() => void handlePackReview(pack.id, "blocked")} className="btn-micro rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20">Заблокувати</button></div>}
                  </div>
                </article>
              ))}
              {sharedPacks.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">У черзі поки немає збірок.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "moderation" && (
        <div className="space-y-6 animate-slide-up-fade">
          <div className="glass-card glow-border p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Журнал порушень фильтру мату ({violations.length})
            </h3>
            {violations.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <CheckCircle2 className="h-12 w-12 text-emerald-500/40 mx-auto mb-2" />
                <p>Жодного порушення не зафіксовано. Чат чистий!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {violations.slice().reverse().map((v) => (
                  <div
                    key={v.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      v.resolved ? "border-white/5 bg-white/[.01] opacity-60" : "border-red-500/30 bg-red-500/10"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{v.username}</span>
                        <span className="text-xs text-zinc-500">{formatTime(v.timestamp)}</span>
                        {v.resolved ? (
                          <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px]">Розглянуто</span>
                        ) : (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">НОВЕ ПОРУШЕННЯ</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-red-200 font-medium break-words">"{v.text}"</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs text-zinc-400">Знайдені слова:</span>
                        {v.words.map((w) => (
                          <span key={w} className="rounded bg-red-500/30 px-1.5 py-0.5 text-xs text-red-200 font-mono">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>

                    {!v.resolved && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const u = users.find((x) => x.id === v.userId || x.username === v.username);
                            if (u) setModTargetUser(u);
                            else alert("Користувача не знайдено");
                          }}
                          className="btn-primary btn-micro bg-red-600 hover:bg-red-700 text-xs py-2 px-3"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" /> Накласти санкції
                        </button>
                        <button
                          onClick={() => handleResolveViolation(v.id)}
                          className="btn-outline btn-micro text-xs py-2 px-3"
                        >
                          Закрити
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODERATION MODAL (BAN / MUTE) ═══ */}
      {modTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card glow-border max-w-md w-full p-6 animate-scale-up border-red-500/30">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                <h3 className="font-bold text-lg text-white">Модерація: {modTargetUser.username}</h3>
              </div>
              <button onClick={() => setModTargetUser(null)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Причина модерації</label>
                <input
                  type="text"
                  placeholder="Наприклад: Використання нецензурної лексики"
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm outline-none focus:border-red-500"
                />
              </div>

              {/* Ban Section */}
              <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4">
                <h4 className="font-bold text-sm text-red-300 flex items-center gap-2 mb-2">
                  <Ban className="h-4 w-4" /> Блокування (БАН)
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: "1 година", min: 60 },
                    { label: "1 день", min: 1440 },
                    { label: "7 днів", min: 10080 },
                    { label: "Назавжди", min: -1 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setBanDuration(opt.min)}
                      className={`py-1.5 text-xs rounded-lg font-semibold transition ${
                        banDuration === opt.min ? "bg-red-600 text-white" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBan(modTargetUser.id, banDuration, modReason)}
                    className="btn-primary bg-red-600 hover:bg-red-700 text-xs py-2 w-full font-bold"
                  >
                    Забанити
                  </button>
                  <button
                    onClick={() => handleBan(modTargetUser.id, 0, "")}
                    className="btn-outline text-xs py-2 w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    Розбанити
                  </button>
                </div>
              </div>

              {/* Mute Section */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
                <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2 mb-2">
                  <VolumeX className="h-4 w-4" /> Заборона чату (МУТ)
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: "15 хвилин", min: 15 },
                    { label: "1 година", min: 60 },
                    { label: "1 день", min: 1440 },
                    { label: "Назавжди", min: -1 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setMuteDuration(opt.min)}
                      className={`py-1.5 text-xs rounded-lg font-semibold transition ${
                        muteDuration === opt.min ? "bg-amber-600 text-white" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMute(modTargetUser.id, muteDuration, modReason)}
                    className="btn-primary bg-amber-600 hover:bg-amber-700 text-xs py-2 w-full font-bold"
                  >
                    Замутити
                  </button>
                  <button
                    onClick={() => handleMute(modTargetUser.id, 0, "")}
                    className="btn-outline text-xs py-2 w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    Розмутити
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
