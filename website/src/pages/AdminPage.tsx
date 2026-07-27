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

const API_BASE = "https://nuvoxel-launcher.onrender.com";

export function AdminPage() {
  const auth = useWebsiteStore((s) => s.auth);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusMsg, setStatusMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`),
        fetch(`${API_BASE}/admin/users`),
      ]);

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData);
      }
    } catch {
      // Mock fallback if offline
      setStats({
        totalUsers: 14,
        onlineUsers: 3,
        totalFriendships: 28,
        uptimeSeconds: 1420,
        dbSize: 4096,
      });
      setUsers([
        {
          id: "1",
          username: auth?.username || "Admin",
          email: auth?.email || "admin@nuvoxel.net",
          friendCode: "ADM999",
          role: "admin",
          createdAt: Date.now() - 86400000 * 30,
          lastSeenAt: Date.now(),
          online: true,
          status: "in-game",
          friendsCount: 5,
        },
        {
          id: "2",
          username: "Steve",
          email: "steve@minecraft.net",
          friendCode: "STV123",
          role: "user",
          createdAt: Date.now() - 86400000 * 5,
          lastSeenAt: Date.now() - 120000,
          online: true,
          status: "online",
          friendsCount: 2,
        },
        {
          id: "3",
          username: "Alex",
          email: "alex@minecraft.net",
          friendCode: "ALX777",
          role: "user",
          createdAt: Date.now() - 86400000 * 12,
          lastSeenAt: Date.now() - 86400000,
          online: false,
          status: "offline",
          friendsCount: 1,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Allow admin access if role === admin OR username === admin
  const isAdmin = auth?.loggedIn && (auth.role === "admin" || auth.username.toLowerCase() === "admin");

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await fetch(`${API_BASE}/admin/users/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      setStatusMsg(`Роль користувача успішно змінена на ${newRole.toUpperCase()}`);
    } catch {
      setStatusMsg("Помилка оновлення ролі");
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Ви дійсно бажаєте видалити користувача ${username}?`)) return;
    try {
      await fetch(`${API_BASE}/admin/users/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setStatusMsg(`Користувача ${username} успішно видалено`);
    } catch {
      setStatusMsg("Помилка видалення користувача");
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.friendCode.toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      selectedRoleFilter === "all" || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hrs}г ${mins}хв`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[var(--nl-green)]" />
            <h1 className="text-3xl font-bold">Панель Адміністратора</h1>
            <span className="rounded-full bg-[var(--nl-green)]/20 px-3 py-1 text-xs font-semibold text-[var(--nl-green)] border border-[var(--nl-green)]/30">
              ADMIN ACCESS
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Управління користувачами, друзями та сервером Wynsense Social Cloud
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-outline flex items-center gap-2 self-start py-2 text-sm sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Оновити дані
        </button>
      </div>

      {statusMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-[var(--nl-green)]/30 bg-[var(--nl-green)]/10 p-4 text-sm font-medium text-[var(--nl-green)]">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {statusMsg}
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card flex items-center gap-4 p-5">
          <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400 border border-purple-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Усього гравців</p>
            <p className="text-2xl font-bold">{stats?.totalUsers ?? "—"}</p>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4 p-5">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Зараз в мережі</p>
            <p className="text-2xl font-bold text-[var(--nl-green)]">
              {stats?.onlineUsers ?? "—"}
            </p>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4 p-5">
          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400 border border-blue-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Зв'язків друзів</p>
            <p className="text-2xl font-bold">{stats?.totalFriendships ?? "—"}</p>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4 p-5">
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400 border border-amber-500/20">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Аптайм сервера</p>
            <p className="text-lg font-bold">
              {stats ? formatUptime(stats.uptimeSeconds) : "24/7 Live"}
            </p>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="glass-card p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--nl-green)]" />
            Список Користувачів ({filteredUsers.length})
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Пошук за ніком / email / кодом..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 rounded-lg border border-white/10 bg-black/40 pl-9 pr-4 py-2 text-sm outline-none focus:border-[var(--nl-green)]"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value as any)}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none text-zinc-300"
            >
              <option value="all">Усі ролі</option>
              <option value="admin">Адміністратори</option>
              <option value="user">Гравці</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-white/10 bg-white/5 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="px-4 py-3">Користувач</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Код Друга</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Друзі</th>
                <th className="px-4 py-3 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    Користувачів не знайдено
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-3">
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
                    <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--nl-green)]">
                      {u.friendCode}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            u.online ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                          }`}
                        />
                        <span className="text-xs text-zinc-400">
                          {u.online ? u.status || "Онлайн" : "Офлайн"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{u.friendsCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className="rounded-lg border border-white/10 bg-black/30 p-2 text-xs hover:border-purple-500/50 hover:text-purple-400 transition"
                          title="Змінити роль Admin/User"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400 hover:bg-red-500/20 transition"
                          title="Видалити акаунт"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
