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
  Clock,
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
}

const API_BASE = "https://nuvoxel-launcher.onrender.com";

type Tab = "overview" | "users" | "launcher";

export function AdminPage() {
  const auth = useWebsiteStore((s) => s.auth);
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusMsg, setStatusMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, chatRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`),
        fetch(`${API_BASE}/admin/users`),
        fetch(`${API_BASE}/admin/chat`),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (chatRes.ok) setChatMessages(await chatRes.json());
    } catch {
      /* offline fallback */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const isAdmin = auth?.loggedIn && (auth.role === "admin" || auth.username?.toLowerCase() === "admin");
  if (!isAdmin) return <Navigate to="/login" replace />;

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await fetch(`${API_BASE}/admin/users/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      setStatusMsg(`Роль змінена на ${newRole.toUpperCase()}`);
    } catch { setStatusMsg("Помилка"); }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole as "admin" | "user" } : u)));
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Видалити ${username}?`)) return;
    try {
      await fetch(`${API_BASE}/admin/users/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setStatusMsg(`${username} видалено`);
    } catch { setStatusMsg("Помилка"); }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.friendCode.toLowerCase().includes(q);
    const matchesRole = selectedRoleFilter === "all" || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const formatUptime = (sec: number) => `${Math.floor(sec / 3600)}г ${Math.floor((sec % 3600) / 60)}хв`;
  const formatTime = (ts: number) => new Date(ts).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Огляд", icon: Activity },
    { id: "users", label: "Користувачі", icon: Users },
    { id: "launcher", label: "Лаунчер & Чат", icon: Gamepad2 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-[var(--nl-green)]" />
            <h1 className="text-3xl font-bold">Панель Адміністратора</h1>
            <span className="rounded-full bg-[var(--nl-green)]/20 px-3 py-1 text-xs font-bold text-[var(--nl-green)] border border-[var(--nl-green)]/30 animate-pulse-glow">
              ADMIN
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">Wynsense Social Cloud Management</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="btn-outline flex items-center gap-2 self-start py-2 text-sm sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Оновити
        </button>
      </div>

      {statusMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-[var(--nl-green)]/30 bg-[var(--nl-green)]/10 p-4 text-sm font-medium text-[var(--nl-green)] animate-fade-up">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {statusMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8 flex gap-1 rounded-xl border border-white/10 bg-black/40 p-1.5 animate-fade-up delay-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-[var(--nl-green)] text-white shadow-lg shadow-[var(--nl-green)]/20"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === "overview" && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, label: "Усього гравців", value: stats?.totalUsers ?? "—", color: "purple" },
              { icon: UserCheck, label: "Зараз онлайн", value: stats?.onlineUsers ?? "—", color: "emerald" },
              { icon: Activity, label: "Зв'язків друзів", value: stats?.totalFriendships ?? "—", color: "blue" },
              { icon: Server, label: "Аптайм", value: stats ? formatUptime(stats.uptimeSeconds) : "—", color: "amber" },
            ].map((card, i) => (
              <div key={card.label} className="glass-card glow-border flex items-center gap-4 p-5 animate-fade-up" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                <div className={`rounded-xl bg-${card.color}-500/10 p-3 text-${card.color}-400 border border-${card.color}-500/20`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">{card.label}</p>
                  <p className="stat-number text-2xl font-bold">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick chat preview */}
          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
              <MessageSquare className="h-5 w-5 text-[var(--nl-green)]" />
              Останні повідомлення чату
            </h3>
            {chatMessages.length === 0 ? (
              <p className="text-zinc-500 text-sm">Поки що немає повідомлень</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {chatMessages.slice(-8).map((m) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-lg bg-white/[.02] p-3 text-sm admin-row">
                    <img src={`https://crafthead.net/avatar/${encodeURIComponent(m.username)}/24`} alt="" className="h-6 w-6 rounded-md mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[var(--nl-green)]">{m.username}</span>
                      <span className="ml-2 text-zinc-500 text-xs">{m.channel === "dm" ? "DM" : "Global"}</span>
                      <p className="text-zinc-300 mt-0.5 break-words">{m.text}</p>
                    </div>
                    <span className="text-xs text-zinc-600 shrink-0">{formatTime(m.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ USERS TAB ═══ */}
      {tab === "users" && (
        <div className="glass-card p-6 animate-fade-up">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--nl-green)]" />
              Користувачі ({filteredUsers.length})
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text" placeholder="Пошук..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-56 rounded-lg border border-white/10 bg-black/40 pl-9 pr-4 py-2 text-sm outline-none focus:border-[var(--nl-green)] transition-colors"
                />
              </div>
              <select value={selectedRoleFilter} onChange={(e) => setSelectedRoleFilter(e.target.value as "all" | "admin" | "user")}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none text-zinc-300"
              >
                <option value="all">Усі</option>
                <option value="admin">Адміни</option>
                <option value="user">Гравці</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-white/10 bg-white/5 text-xs text-zinc-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Користувач</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Код</th>
                  <th className="px-4 py-3">Роль</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Друзі</th>
                  <th className="px-4 py-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Не знайдено</td></tr>
                ) : filteredUsers.map((u) => (
                  <tr key={u.id} className="admin-row">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-3">
                      <img src={`https://crafthead.net/avatar/${encodeURIComponent(u.username)}/32`} alt="" className="h-8 w-8 rounded-lg border border-white/10"
                        onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                      />
                      <span>{u.username}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--nl-green)]">{u.friendCode}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        u.role === "admin" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-zinc-800 text-zinc-400"
                      }`}>{u.role.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${u.online ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                        <span className="text-xs text-zinc-400">{u.online ? u.status || "Онлайн" : "Офлайн"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{u.friendsCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleToggleRole(u.id, u.role)}
                          className="rounded-lg border border-white/10 bg-black/30 p-2 text-xs hover:border-purple-500/50 hover:text-purple-400 transition" title="Змінити роль">
                          <Key className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id, u.username)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400 hover:bg-red-500/20 transition" title="Видалити">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ LAUNCHER & CHAT TAB ═══ */}
      {tab === "launcher" && (
        <div className="space-y-6 animate-fade-up">
          {/* Launcher users */}
          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
              <Gamepad2 className="h-5 w-5 text-[var(--nl-green)]" />
              Зареєстровані гравці лаунчера ({users.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.02] p-4 admin-row">
                  <img src={`https://crafthead.net/avatar/${encodeURIComponent(u.username)}/40`} alt="" className="h-10 w-10 rounded-xl border border-white/10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{u.username}</span>
                      {u.online && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-mono text-[var(--nl-green)]">{u.friendCode}</span>
                      <span>·</span>
                      <span>{u.friendsCount} друзів</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatTime(u.lastSeenAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full chat log */}
          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
              <MessageSquare className="h-5 w-5 text-[var(--nl-green)]" />
              Лог чату ({chatMessages.length} повідомлень)
            </h3>
            {chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Поки що немає повідомлень у чаті</p>
                <p className="text-zinc-600 text-sm mt-1">Повідомлення з'являться коли гравці почнуть спілкуватися в лаунчері</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {chatMessages.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-lg bg-white/[.02] p-3 text-sm admin-row">
                    <img src={`https://crafthead.net/avatar/${encodeURIComponent(m.username)}/28`} alt="" className="h-7 w-7 rounded-md mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{m.username}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          m.channel === "dm" ? "bg-blue-500/20 text-blue-300" : "bg-emerald-500/20 text-emerald-300"
                        }`}>
                          {m.channel === "dm" ? "Особисті" : "Глобальний"}
                        </span>
                        <span className="text-xs text-zinc-600">{formatTime(m.timestamp)}</span>
                      </div>
                      <p className="text-zinc-300 mt-1 break-words">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
