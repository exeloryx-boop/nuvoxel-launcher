import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Shield,
  Copy,
  Check,
  Sparkles,
  Gamepad2,
  Palette,
  LogOut,
  Users,
  CheckCircle2,
  Zap,
  Activity,
  Award,
  RefreshCw,
  MessageSquare,
  Package,
  Clock,
  Wifi,
  WifiOff,
  Calendar,
} from "lucide-react";
import { useWebsiteStore, getApiBase } from "../store/useWebsiteStore";
import { getSkinAvatarUrl } from "@shared/skins";

interface ProfileData {
  id: string;
  username: string;
  email: string;
  friendCode: string;
  role: string;
  createdAt: number;
  lastSeenAt: number;
  online: boolean;
  status: string;
  friendsCount: number;
  chatCount: number;
  packsCount: number;
  bannedUntil: number | null;
  mutedUntil: number | null;
}

export function ProfilePage() {
  const auth = useWebsiteStore((s) => s.auth);
  const logout = useWebsiteStore((s) => s.logout);
  const selectedSkin = useWebsiteStore((s) => s.selectedSkin);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMsg, setStatusMsg] = useState("В мережі — Nuvoxel Launcher");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState(statusMsg);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncTime, setSyncTime] = useState<number | null>(null);

  const isAdmin = auth?.loggedIn && (auth.role === "admin" || auth.username.toLowerCase() === "admin");
  const friendCode = profile?.friendCode || auth?.friendCode || "#NVXL77";

  // Fetch live profile from API
  const fetchProfile = async () => {
    if (!auth?.token) return;
    setSyncing(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/profile`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.status) setStatusMsg(data.status);
        setSyncTime(Date.now());
      }
    } catch {
      /* offline fallback */
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // Auto-sync every 30s
    const interval = setInterval(fetchProfile, 30000);
    return () => clearInterval(interval);
  }, [auth?.token]);

  const copyFriendCode = () => {
    navigator.clipboard.writeText(friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveStatus = async () => {
    setStatusMsg(tempStatus);
    setIsEditingStatus(false);
    if (!auth?.token) return;
    try {
      await fetch(`${getApiBase()}/auth/profile/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ status: tempStatus }),
      });
    } catch { /* ignore */ }
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("uk-UA", {
      day: "2-digit", month: "long", year: "numeric",
    });

  const timeSince = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "щойно";
    if (mins < 60) return `${mins} хв тому`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} год тому`;
    return `${Math.floor(hrs / 24)} дн тому`;
  };

  if (!auth?.loggedIn) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="rounded-full bg-purple-500/10 p-6 text-purple-400 border border-purple-500/20 mb-4 animate-bounce-in">
          <User className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold">Вхід не виконано</h1>
        <p className="mt-2 text-zinc-400">Увійдіть у свій акаунт Nuvoxel Launcher, щоб переглянути свій профіль.</p>
        <Link to="/login" className="btn-primary mt-6">
          Увійти зараз
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] overflow-hidden py-12">
      {/* Background ambient light orbs */}
      <div className="orb orb-1 opacity-40"></div>
      <div className="orb orb-2 opacity-40"></div>
      <div className="orb orb-3 opacity-30"></div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10 space-y-8">
        {/* Sync Status Bar */}
        <div className="flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {syncing ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin text-[var(--studio-mint)]" /> Синхронізація...</>
            ) : syncTime ? (
              <><Wifi className="h-3.5 w-3.5 text-emerald-400" /> Синхронізовано {timeSince(syncTime)}</>
            ) : (
              <><WifiOff className="h-3.5 w-3.5 text-zinc-600" /> Офлайн-режим</>
            )}
          </div>
          <button onClick={fetchProfile} className="btn-micro text-xs text-zinc-500 hover:text-white flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 bg-white/5">
            <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} /> Оновити
          </button>
        </div>

        {/* Profile Hero Card */}
        <div className="glass-card glow-border overflow-hidden p-6 sm:p-8 animate-fade-up">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {/* Skin / Avatar Box */}
              <div className="relative group">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-900/60 via-amber-600/30 to-purple-500/20 border border-white/20 shadow-xl shadow-purple-900/20 overflow-hidden text-2xl font-black text-white group-hover:scale-105 transition-transform duration-300">
                  {selectedSkin ? (
                    <img src={selectedSkin.customSkinData ?? getSkinAvatarUrl(selectedSkin.username, 160, selectedSkin.model)} alt="Skin" className="h-full w-full object-cover" />
                  ) : (
                    <span>{auth.username[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#0a0a0f]" title="Онлайн">
                  <div className="h-2 w-2 rounded-full bg-white animate-ping" />
                </div>
              </div>

              {/* User Info & Badges */}
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{auth.username}</h1>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/20 px-3 py-0.5 text-xs font-semibold text-purple-300 shadow-sm shadow-purple-500/30 animate-pulse-glow">
                      <Shield className="h-3.5 w-3.5" />
                      Адміністратор
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--studio-mint)]/40 bg-[var(--studio-mint)]/20 px-3 py-0.5 text-xs font-semibold text-[var(--studio-mint)]">
                      <Award className="h-3.5 w-3.5" />
                      Гравець Nuvoxel
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Синхронізовано
                  </span>
                </div>

                {/* Status Message */}
                <div className="mt-2 flex items-center gap-2">
                  {isEditingStatus ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempStatus}
                        onChange={(e) => setTempStatus(e.target.value)}
                        className="rounded-lg border border-white/20 bg-black/40 px-3 py-1 text-xs text-white outline-none focus:border-[var(--studio-mint)]"
                        placeholder="Введіть ваш статус..."
                        onKeyDown={(e) => e.key === "Enter" && handleSaveStatus()}
                      />
                      <button onClick={handleSaveStatus} className="btn-micro rounded-md bg-[var(--studio-mint)] px-2 py-1 text-xs font-semibold text-black">
                        Зберегти
                      </button>
                    </div>
                  ) : (
                    <p
                      onClick={() => { setTempStatus(statusMsg); setIsEditingStatus(true); }}
                      className="cursor-pointer text-sm text-zinc-400 hover:text-white transition flex items-center gap-1.5"
                      title="Натисніть для редагування статусу"
                    >
                      <Activity className="h-3.5 w-3.5 text-[var(--studio-mint)] animate-pulse" />
                      <span>"{statusMsg}"</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Logout */}
            <div className="flex items-center gap-3">
              <button
                onClick={logout}
                className="btn-outline border-red-500/30 text-red-400 hover:bg-red-500/20 px-4 py-2 text-sm font-semibold"
              >
                <LogOut className="h-4 w-4" />
                Вийти
              </button>
            </div>
          </div>
        </div>

        {/* Live Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-4">
          {[
            { icon: Users, label: "Друзів", value: profile?.friendsCount ?? 0, accent: "text-[var(--studio-mint)]", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { icon: MessageSquare, label: "Повідомлень", value: profile?.chatCount ?? 0, accent: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
            { icon: Package, label: "Збірок", value: profile?.packsCount ?? 0, accent: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
            { icon: Calendar, label: "Акаунт створено", value: profile?.createdAt ? formatDate(profile.createdAt) : "—", accent: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
          ].map((s, i) => (
            <div key={s.label} className="glass-card hover-lift p-5 animate-fade-up" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <span>{s.label}</span>
                <div className={`rounded-lg ${s.bg} border p-2`}>
                  <s.icon className={`h-4 w-4 ${s.accent}`} />
                </div>
              </div>
              <p className={`text-2xl font-extrabold ${s.accent}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Info Grid Cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Card 1: Friend Code */}
          <div className="glass-card hover-lift p-6 animate-fade-up delay-100">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Код Друга Nuvoxel</span>
              <Users className="h-4 w-4 text-[var(--studio-mint)]" />
            </div>
            <div className="flex items-center justify-between mt-3 rounded-xl border border-white/10 bg-black/40 p-3">
              <span className="font-mono text-lg font-bold text-amber-300">{friendCode}</span>
              <button
                onClick={copyFriendCode}
                className="btn-micro rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 hover:text-white hover:bg-white/10 transition"
                title="Скопіювати код"
              >
                {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Поділіться кодом з друзями в лаунчері для спільної гри.</p>
          </div>

          {/* Card 2: Launcher Integration */}
          <div className="glass-card hover-lift p-6 animate-fade-up delay-200">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Nuvoxel Launcher</span>
              <Gamepad2 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-sm font-semibold text-white">Синхронізовано з Лаунчером</span>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Профіль, скіни та друзі синхронізуються автоматично кожні 30 секунд.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-[11px] text-zinc-500">
                {profile?.lastSeenAt ? `Останній вхід: ${timeSince(profile.lastSeenAt)}` : "Очікування синхронізації..."}
              </span>
            </div>
          </div>

          {/* Card 3: Skin & Customization */}
          <div className="glass-card hover-lift p-6 animate-fade-up delay-300">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Скін та Візуал</span>
              <Palette className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-3 text-sm font-semibold text-white truncate">
              {selectedSkin ? selectedSkin.name : "Класичний скін (Steve)"}
            </div>
            <Link to="/skins" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--studio-mint)] hover:underline">
              <Sparkles className="h-3.5 w-3.5" />
              Змінити скін або плащ →
            </Link>
          </div>
        </div>

        {/* Main Details & Features */}
        <div className="glass-card p-6 sm:p-8 animate-fade-up delay-400">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[var(--studio-mint)]" />
            Переваги вашого профілю
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/20 transition">
              <h3 className="font-semibold text-white text-sm">🎮 Вхід у гру без додаткових реєстрацій</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Нікнейм та пароль підходять як для веб-сайту, так і для запуску Minecraft через Nuvoxel Launcher.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/20 transition">
              <h3 className="font-semibold text-white text-sm">💬 Соціальний чат і друзі</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Додавайте друзів за допомогою Коду Друга та листуйтеся в реальному часі прямо з гри чи адмінки.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/20 transition">
              <h3 className="font-semibold text-white text-sm">🔄 Авто-синхронізація</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Ваш статус, скіни та налаштування синхронізуються між сайтом та лаунчером у реальному часі.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/20 transition">
              <h3 className="font-semibold text-white text-sm">✨ Персоналізація скінів</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Безкоштовно завантажуйте скіни HD якості та плащі для вашого персонажа.
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-6 rounded-xl border border-purple-500/30 bg-purple-500/10 p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-purple-300 text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Панель Адміністратора Wynsense
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  У вас є доступ до керування гравцями, чатом та банами.
                </p>
              </div>
              <Link to="/admin" className="btn-primary bg-purple-600 hover:bg-purple-700 border-none text-xs font-semibold px-4 py-2">
                Відкрити адмінку
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
