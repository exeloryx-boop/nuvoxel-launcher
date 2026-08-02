import { Link, NavLink, Outlet } from "react-router-dom";
import { Download, Globe, LogOut, Menu, Shield, User, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = Boolean(auth?.loggedIn && (auth.role === "admin" || auth.username.toLowerCase() === "admin"));
  const nav = [
    { to: "/", label: t("navHome"), end: true },
    { to: "/mods", label: t("navMods") },
    { to: "/servers", label: t("navServers") },
    { to: "/community", label: t("navCommunity") },
  ];

  useEffect(() => {
    hydrate();
    window.addEventListener(AUTH_CHANGE_EVENT, hydrate);
    window.addEventListener(SKIN_CHANGE_EVENT, hydrate);
    window.addEventListener("storage", hydrate);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, hydrate);
      window.removeEventListener(SKIN_CHANGE_EVENT, hydrate);
      window.removeEventListener("storage", hydrate);
    };
  }, [hydrate]);

  const links = (mobile = false) => <nav className={mobile ? "site-mobile-nav" : "site-nav"}>
    {nav.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)}>{item.label}</NavLink>)}
    {auth?.loggedIn && <><NavLink to="/profile" onClick={() => setMenuOpen(false)}>Профіль</NavLink><NavLink to="/skins" onClick={() => setMenuOpen(false)}>{t("navSkins")}</NavLink></>}
    {isAdmin && <NavLink to="/admin" onClick={() => setMenuOpen(false)} className="admin-link"><Shield className="h-3.5 w-3.5" /> Адмінка</NavLink>}
  </nav>;

  return <div key={locale} className="site-shell">
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-brand" onClick={() => setMenuOpen(false)}>
          <span className="site-brand-mark"><img src="/logo.svg" alt="" /></span>
          <span><strong>NUVOXEL</strong><small>PLAY WITHOUT LIMITS</small></span>
        </Link>
        {links()}
        <div className="site-actions">
          <label className="language-select"><Globe className="h-3.5 w-3.5" /><select value={locale} onChange={(e) => setLanguage(e.target.value as "ru" | "uk" | "en")} aria-label={t("language")}><option value="uk">UA</option><option value="en">EN</option><option value="ru">RU</option></select></label>
          <Link to="/download" className="site-download"><Download className="h-4 w-4" /> {t("download")}</Link>
          {auth?.loggedIn ? <><Link to={isAdmin ? "/admin" : "/profile"} className="site-user"><img src={`https://crafthead.net/avatar/${encodeURIComponent(auth.username)}/28`} alt="" /> <span>{auth.username}</span></Link><button className="site-icon-button" onClick={logout} title={t("logout")}><LogOut className="h-4 w-4" /></button></> : <Link to="/login" className="site-login"><User className="h-4 w-4" /> {t("login")}</Link>}
        </div>
        <button type="button" className="site-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Menu">{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {menuOpen && <div className="site-mobile-menu">{links(true)}<div className="site-mobile-bottom"><label className="language-select"><Globe className="h-4 w-4" /><select value={locale} onChange={(e) => setLanguage(e.target.value as "ru" | "uk" | "en")}><option value="uk">Українська</option><option value="en">English</option><option value="ru">Русский</option></select></label><Link to="/download" onClick={() => setMenuOpen(false)} className="site-download"><Download className="h-4 w-4" /> {t("download")}</Link></div></div>}
    </header>
    <main className="site-main"><Outlet /></main>
    <SiteFooter />
  </div>;
}
