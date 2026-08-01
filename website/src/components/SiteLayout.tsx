import { Link, NavLink, Outlet } from "react-router-dom";
import { Download, Globe, LogOut, Shield, Menu, X, User } from "lucide-react";
import { useEffect, useState } from "react";
import { AUTH_CHANGE_EVENT, SKIN_CHANGE_EVENT } from "@shared/skins";
import { useWebsiteStore } from "../store/useWebsiteStore";
import { useWebI18n } from "../hooks/useWebI18n";
import { SiteFooter } from "./SiteFooter";

export function SiteLayout() {
  const { t, locale, setLanguage } = useWebI18n();
  const auth = useWebsiteStore((s) => s.auth);
  const logout = useWebsiteStore((s) => s.logout);
  const hydrate = useWebsiteStore((s) => s.hydrate);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = auth?.loggedIn && (auth.role === "admin" || auth.username.toLowerCase() === "admin");

  const nav = [
    { to: "/", label: t("navHome"), end: true },
    { to: "/mods", label: t("navMods") },
    { to: "/servers", label: t("navServers") },
    { to: "/community", label: t("navCommunity") },
  ];

  useEffect(() => {
    hydrate();
    const onAuth = () => hydrate();
    const onSkin = () => hydrate();
    window.addEventListener(AUTH_CHANGE_EVENT, onAuth);
    window.addEventListener(SKIN_CHANGE_EVENT, onSkin);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, onAuth);
      window.removeEventListener(SKIN_CHANGE_EVENT, onSkin);
      window.removeEventListener("storage", onAuth);
    };
  }, [hydrate]);

  return (
    <div key={locale} className="flex min-h-screen flex-col bg-[#07070b] text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07070b]/80 backdrop-blur-2xl transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 font-bold group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-emerald-500 p-[1px] shadow-lg shadow-purple-500/20 transition group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#07070b]">
                <img
                  src="/logo.svg"
                  alt="Nuvoxel Logo"
                  className="h-6 w-6 rounded-lg transition-transform duration-300 group-hover:rotate-6"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white group-hover:text-purple-300 transition-colors">
                Nuvoxel <span className="text-[var(--nl-green)]">Launcher</span>
              </span>
              <span className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
                Wynsense Ecosystem
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600/80 to-emerald-600/80 text-white shadow-md shadow-purple-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {auth?.loggedIn && (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-purple-600/80 text-white shadow-md shadow-purple-500/20"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  Профіль
                </NavLink>
                <NavLink
                  to="/skins"
                  className={({ isActive }) =>
                    `rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[var(--nl-green)]/20 text-[var(--nl-green)] border border-[var(--nl-green)]/40"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  {t("navSkins")}
                </NavLink>
              </>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40"
                      : "bg-purple-950/40 text-purple-300 border border-purple-500/30 hover:bg-purple-900/50 hover:text-white"
                  }`
                }
              >
                <Shield className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
                Адмінка
              </NavLink>
            )}
          </nav>

          {/* Desktop Controls */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Language Selector */}
            <div className="relative flex items-center rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 backdrop-blur-md">
              <Globe className="h-3.5 w-3.5 text-zinc-400 mr-1.5" />
              <select
                value={locale}
                onChange={(e) => setLanguage(e.target.value as "ru" | "uk" | "en")}
                className="bg-transparent text-xs font-semibold text-zinc-200 outline-none cursor-pointer"
                aria-label={t("language")}
              >
                <option value="uk" className="bg-[#0e0e14] text-white">UA</option>
                <option value="en" className="bg-[#0e0e14] text-white">EN</option>
                <option value="ru" className="bg-[#0e0e14] text-white">RU</option>
              </select>
            </div>

            {/* Download Button */}
            <Link
              to="/download"
              className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-lg shadow-[var(--nl-green)]/20 hover:scale-105 transition-transform"
            >
              <Download className="h-3.5 w-3.5" />
              {t("download")}
            </Link>

            {/* User Profile & Auth */}
            {auth?.loggedIn ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <Link
                  to={isAdmin ? "/admin" : "/profile"}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
                    isAdmin
                      ? "border-purple-500/40 bg-purple-500/15 text-purple-200 hover:border-purple-400 shadow-md shadow-purple-500/20"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-500/60"
                  }`}
                  title={isAdmin ? "Панель адміністратора" : "Мій Профіль"}
                >
                  <img
                    src={`https://crafthead.net/avatar/${encodeURIComponent(auth.username)}/24`}
                    alt=""
                    className="h-5 w-5 rounded-md border border-white/20"
                  />
                  <span>{auth.username}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300"
                  title={t("logout")}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10"
              >
                <User className="h-3.5 w-3.5 text-zinc-400" />
                {t("login")}
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-white/10 bg-black/50 p-2 text-zinc-300 transition hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-white/10 bg-[#0c0c14]/95 p-4 backdrop-blur-2xl md:hidden animate-slide-down">
            <nav className="flex flex-col gap-2">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-purple-600/80 text-white"
                        : "text-zinc-300 hover:bg-white/5"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {auth?.loggedIn && (
                <NavLink
                  to="/skins"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[var(--nl-green)]/20 text-[var(--nl-green)]"
                        : "text-zinc-300 hover:bg-white/5"
                    }`
                  }
                >
                  {t("navSkins")}
                </NavLink>
              )}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      isActive
                        ? "bg-purple-600 text-white"
                        : "bg-purple-950/40 text-purple-300 border border-purple-500/30"
                    }`
                  }
                >
                  <Shield className="h-4 w-4 text-purple-400" />
                  Адмінка
                </NavLink>
              )}
            </nav>

            <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                  <Globe className="h-4 w-4" />
                  {t("language")}
                </label>
                <select
                  value={locale}
                  onChange={(e) => setLanguage(e.target.value as "ru" | "uk" | "en")}
                  className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white outline-none"
                >
                  <option value="uk">Українська (UA)</option>
                  <option value="en">English (EN)</option>
                  <option value="ru">Русский (RU)</option>
                </select>
              </div>

              <Link
                to="/download"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-center"
              >
                <Download className="h-4 w-4" />
                {t("download")}
              </Link>

              {auth?.loggedIn ? (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://crafthead.net/avatar/${encodeURIComponent(auth.username)}/28`}
                      alt=""
                      className="h-7 w-7 rounded-lg border border-white/20"
                    />
                    <span className="font-bold text-white text-sm">{auth.username}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t("logout")}
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-bold text-white"
                >
                  <User className="h-4 w-4" />
                  {t("login")}
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
