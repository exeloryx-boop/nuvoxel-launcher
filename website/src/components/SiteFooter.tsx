import { Link } from "react-router-dom";
import { useWebI18n } from "../hooks/useWebI18n";

export function SiteFooter() {
  const { t } = useWebI18n();

  const product = [
    { to: "/download", label: t("download") },
    { to: "/features", label: t("footerFeatures") },
    { to: "/versions", label: t("footerVersions") },
    { to: "/skins", label: t("navSkins") },
  ];

  const community = [
    { href: "https://discord.gg/", label: "Discord" },
    { href: "https://t.me/", label: "Telegram" },
    { href: "https://vk.com/", label: "VK" },
    { href: "https://youtube.com/", label: "YouTube" },
  ];

  const support = [
    { to: "/help", label: t("footerHelp") },
    { to: "/business", label: t("footerBusiness") },
    { to: "/docs", label: t("footerDocs") },
    { to: "/feedback", label: t("footerFeedback") },
  ];

  return (
    <footer className="border-t border-white/8 bg-[#08080c]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        <div>
          <div className="mb-3 flex items-center gap-2.5 font-bold">
            <img src="/logo.svg" alt="" className="h-8 w-8 rounded-lg" />
            nuvoxel.net
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            {t("footerTagline")}
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">{t("footerProduct")}</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            {product.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">{t("footerCommunity")}</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            {community.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">{t("footerSupport")}</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            {support.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/8 px-4 py-4 text-center text-xs text-zinc-500 sm:px-6">
        <p>{t("footerCopyright")}</p>
        <p className="mt-2 flex justify-center gap-4">
          <Link to="/privacy" className="hover:text-zinc-300">
            {t("footerPrivacy")}
          </Link>
          <Link to="/terms" className="hover:text-zinc-300">
            {t("footerTerms")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
