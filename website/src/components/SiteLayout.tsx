import { Link, NavLink, Outlet } from "react-router-dom";
import { Download, Globe, LogOut, User, Shield } from "lucide-react";
import { useEffect } from "react";
import { AUTH_CHANGE_EVENT, SKIN_CHANGE_EVENT } from "@shared/skins";
import { useWebsiteStore } from "../store/useWebsiteStore";
import { useWebI18n } from "../hooks/useWebI18n";
import { SiteFooter } from "./SiteFooter";

export function SiteLayout() {
  const { t, locale, setLanguage } = useWebI18n();
  const auth = useWebsiteStore((s) => s.auth);
  const logout = useWebsiteStore((s) => s.logout);
  const hydrate = useWebsiteStore((s) => s.hydrate);

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
    <div key={locale} className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold">
            <img
              src="/logo.svg"
              alt=""
              className="h-9 w-9 rounded-lg shadow-md shadow-purple-900/30"
            />
            <span>
              Nuvoxel Launcher
              <span className="ml-1 text-sm font-normal text-zinc-400">
                .net
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {auth?.loggedIn && (
              <NavLink
                to="/skins"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-[var(--nl-green)]/20 text-[var(--nl-green)]"
                      : "text-zinc-400 hover:text-white"
                  }`
                }
              >
                {t("navSkins")}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold transition flex items-center gap-1.5 ${
                    isActive
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-purple-400 hover:bg-purple-500/10"
                  }`
                }
              >
                <Shield className="h-4 w-4" />
                Адмінка
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-1 sm:flex">
              <Globe className="h-4 w-4 text-zinc-500" />
              <select
                value={locale}
                onChange={(e) =>
                  setLanguage(e.target.value as "ru" | "uk" | "en")
                }
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-zinc-300 outline-none"
                aria-label={t("language")}
              >
                <option value="ru">RU</option>
                <option value="uk">UA</option>
                <option value="en">EN</option>
              </select>
            </label>
            <Link
              to="/download"
              className="btn-primary hidden px-4 py-2 text-sm sm:inline-flex font-semibold shadow-lg shadow-[var(--nl-green)]/20"
            >
              <Download className="h-4 w-4" />
              {t("download")}
            </Link>
            {auth?.loggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  to={isAdmin ? "/admin" : "/skins"}
                  className="btn-outline hidden px-3 py-2 text-sm sm:inline-flex items-center gap-1.5"
                >
                  {isAdmin ? <Shield className="h-4 w-4 text-purple-400" /> : <User className="h-4 w-4 text-[var(--nl-green)]" />}
                  {auth.username}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="btn-outline px-3 py-2 text-sm"
                  title={t("logout")}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-outline px-4 py-2 text-sm font-semibold">
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
