import { useState } from "react";
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
  Award
} from "lucide-react";
import { useWebsiteStore } from "../store/useWebsiteStore";
import { getSkinAvatarUrl } from "@shared/skins";

export function ProfilePage() {
  const auth = useWebsiteStore((s) => s.auth);
  const logout = useWebsiteStore((s) => s.logout);
  const selectedSkin = useWebsiteStore((s) => s.selectedSkin);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusMsg, setStatusMsg] = useState("В мережі — Nuvoxel Launcher");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState(statusMsg);

  const isAdmin = auth?.loggedIn && (auth.role === "admin" || auth.username.toLowerCase() === "admin");
  const friendCode = auth?.friendCode ? `#${auth.friendCode}` : "#NVXL77";

  const copyFriendCode = () => {
    navigator.clipboard.writeText(friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveStatus = () => {
    setStatusMsg(tempStatus);
    setIsEditingStatus(false);
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
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--nl-green)]/40 bg-[var(--nl-green)]/20 px-3 py-0.5 text-xs font-semibold text-[var(--nl-green)]">
                      <Award className="h-3.5 w-3.5" />
                      Гравець Nuvoxel
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Акаунт підтверджено
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
                        className="rounded-lg border border-white/20 bg-black/40 px-3 py-1 text-xs text-white outline-none focus:border-[var(--nl-green)]"
                        placeholder="Введіть ваш статус..."
                      />
                      <button onClick={handleSaveStatus} className="btn-micro rounded-md bg-[var(--nl-green)] px-2 py-1 text-xs font-semibold text-white">
                        Зберегти
                      </button>
                    </div>
                  ) : (
                    <p
                      onClick={() => { setTempStatus(statusMsg); setIsEditingStatus(true); }}
                      className="cursor-pointer text-sm text-zinc-400 hover:text-white transition flex items-center gap-1.5"
                      title="Натисніть для редагування статусу"
                    >
                      <Activity className="h-3.5 w-3.5 text-[var(--nl-green)] animate-pulse" />
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

        {/* Info Grid Cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Card 1: Friend Code */}
          <div className="glass-card hover-lift p-6 animate-fade-up delay-100">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Код Друга Nuvoxel</span>
              <Users className="h-4 w-4 text-[var(--nl-green)]" />
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
              Ваш акаунт повністю синхронізовано з клієнтом Minecraft 1.21.8.
            </p>
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
            <Link to="/skins" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--nl-green)] hover:underline">
              <Sparkles className="h-3.5 w-3.5" />
              Змінити скін або плащ →
            </Link>
          </div>
        </div>

        {/* Main Details & Features */}
        <div className="glass-card p-6 sm:p-8 animate-fade-up delay-400">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[var(--nl-green)]" />
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
              <h3 className="font-semibold text-white text-sm">🛡️ Модерація та захист</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Ваш акаунт захищений анти-чітом та вбудованим фільтром безпеки Nuvoxel.
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
