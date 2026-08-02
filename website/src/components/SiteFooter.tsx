import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useWebI18n } from "../hooks/useWebI18n";

export function SiteFooter() {
  const { t } = useWebI18n();
  const groups = [
    [t("footerProduct"), [["/download", t("download")], ["/features", t("footerFeatures")], ["/versions", t("footerVersions")], ["/skins", t("navSkins")]]],
    [t("footerSupport"), [["/help", t("footerHelp")], ["/docs", t("footerDocs")], ["/feedback", t("footerFeedback")], ["/business", t("footerBusiness")]]],
  ] as const;
  return <footer className="site-footer"><div className="site-footer-grid"><div className="site-footer-intro"><Link to="/" className="site-brand"><span className="site-brand-mark"><img src="/logo.svg" alt="" /></span><span><strong>NUVOXEL</strong><small>PLAY WITHOUT LIMITS</small></span></Link><p>{t("footerTagline")}</p><div className="site-socials"><a href="https://discord.gg/" target="_blank" rel="noreferrer">Discord <ArrowUpRight /></a><a href="https://t.me/" target="_blank" rel="noreferrer">Telegram <ArrowUpRight /></a></div></div>{groups.map(([title, links]) => <div key={title}><h4>{title}</h4><ul>{links.map(([to, label]) => <li key={to}><Link to={to}>{label}</Link></li>)}</ul></div>)}<div><h4>{t("footerCommunity")}</h4><ul><li><Link to="/community">{t("navCommunity")}</Link></li><li><Link to="/servers">{t("navServers")}</Link></li><li><Link to="/mods">{t("navMods")}</Link></li></ul></div></div><div className="site-footer-bottom"><span>{t("footerCopyright")}</span><span><Link to="/privacy">{t("footerPrivacy")}</Link><Link to="/terms">{t("footerTerms")}</Link></span></div></footer>;
}
