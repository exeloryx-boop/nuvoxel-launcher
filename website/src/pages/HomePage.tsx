import { Link } from "react-router-dom";
import {
  Download,
  MessageCircle,
  Palette,
  Package,
  Server,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useWebI18n } from "../hooks/useWebI18n";

export function HomePage() {
  const { t, skinCategory } = useWebI18n();

  const steps = [
    { n: "01", title: t("homeStep1Title"), text: t("homeStep1Text") },
    { n: "02", title: t("homeStep2Title"), text: t("homeStep2Text") },
    { n: "03", title: t("homeStep3Title"), text: t("homeStep3Text") },
  ];

  const devTools = [
    { title: t("homeDevBtn1Title"), text: t("homeDevBtn1Text"), to: "/business" },
    { title: t("homeDevBtn2Title"), text: t("homeDevBtn2Text"), to: "/business" },
    { title: t("homeDevBtn3Title"), text: t("homeDevBtn3Text"), to: "/business" },
  ];

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url(/bg-home.png)" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/80 to-[#0a0a0f]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="section-label mb-4">{t("homeHeroLabel")}</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            {t("homeHeroTitle1")}
            <br />
            <span className="text-[var(--nl-green)]">{t("homeHeroTitle2")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-400">{t("homeHeroDesc")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/download" className="btn-primary">
              <Download className="h-5 w-5" />
              {t("homeDownloadWin")}
            </Link>
            <a
              href="https://discord.gg/"
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              <MessageCircle className="h-5 w-5" />
              {t("homeDiscord")}
            </a>
          </div>
          <p className="mt-6 text-sm text-zinc-500">{t("homeTagline")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="glass-card p-8 text-center">
          <Zap className="mx-auto h-10 w-10 text-[var(--nl-green)]" />
          <h2 className="mt-4 text-2xl font-bold">{t("homeFastTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-zinc-400">{t("homeFastDesc")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="section-label mb-2">{t("homeFeaturesLabel")}</p>
        <h2 className="mb-10 text-3xl font-bold">{t("homeFeaturesTitle")}</h2>
        <p className="mb-10 max-w-2xl text-zinc-400">{t("homeFeaturesDesc")}</p>

        <div className="grid gap-6 lg:grid-cols-3">
          <FeatureCard
            label={t("homeServersLabel")}
            icon={Server}
            title={t("homeServersTitle")}
            bullets={[t("homeServersBullet1"), t("homeServersBullet2")]}
            mock={
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">HiTech RPG</p>
                <p className="font-semibold text-[var(--nl-green)]">
                  {t("homeServersMockPlayers", { count: "1 240" })}
                </p>
                <span className="mt-2 inline-block rounded-lg bg-[var(--nl-green)] px-3 py-1 text-xs font-semibold text-white">
                  {t("homeJoinServer")}
                </span>
              </div>
            }
          />
          <FeatureCard
            label={t("homeModsLabel")}
            icon={Package}
            title={t("homeModsTitle")}
            bullets={[t("homeModsBullet1"), t("homeModsBullet2")]}
            mock={
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
                <p className="text-zinc-400">{t("homeModsMock")}</p>
                <p className="mt-1 text-xs text-zinc-500">Modrinth · Fabric</p>
              </div>
            }
          />
          <FeatureCard
            label={t("homeSkinsLabel")}
            icon={Palette}
            title={t("homeSkinsTitle")}
            bullets={[t("homeSkinsBullet1"), t("homeSkinsBullet2")]}
            mock={
              <div className="mt-4 flex gap-2">
                {(["boys", "anime", "popular"] as const).map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-400"
                  >
                    {skinCategory(cat)}
                  </span>
                ))}
              </div>
            }
            cta={{ to: "/login", label: t("homeSkinsCta") }}
          />
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#08080c] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="section-label mb-2">{t("homeDevLabel")}</p>
          <h2 className="mb-10 text-3xl font-bold">{t("homeDevTitle")}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {devTools.map((item) => (
              <div key={item.title} className="glass-card p-6">
                <Sparkles className="h-6 w-6 text-[var(--nl-green)]" />
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{item.text}</p>
                <Link
                  to={item.to}
                  className="mt-4 inline-block text-sm font-medium text-[var(--nl-green)] hover:underline"
                >
                  {t("homeGoTo")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="mb-12 text-center text-3xl font-bold">
          {t("homeStepsTitle")}{" "}
          <span className="text-[var(--nl-green)]">{t("homeStepsHighlight")}</span>
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="glass-card p-6">
              <span className="text-4xl font-bold text-[var(--nl-green)]/40">
                {s.n}
              </span>
              <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="glass-card flex flex-col items-center gap-6 p-10 text-center">
          <Users className="h-12 w-12 text-[var(--nl-green)]" />
          <h2 className="text-2xl font-bold">{t("homeCtaTitle")}</h2>
          <Link to="/download" className="btn-primary">
            <Download className="h-5 w-5" />
            {t("homeDownloadWin")}
          </Link>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  label,
  icon: Icon,
  title,
  bullets,
  mock,
  cta,
}: {
  label: string;
  icon: typeof Server;
  title: string;
  bullets: string[];
  mock: React.ReactNode;
  cta?: { to: string; label: string };
}) {
  return (
    <div className="glass-card flex flex-col p-6">
      <p className="section-label">{label}</p>
      <Icon className="mt-3 h-8 w-8 text-[var(--nl-green)]" />
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <ul className="mt-3 space-y-1 text-sm text-zinc-400">
        {bullets.map((b) => (
          <li key={b}>· {b}</li>
        ))}
      </ul>
      {mock}
      {cta && (
        <Link
          to={cta.to}
          className="mt-auto pt-4 text-sm font-medium text-[var(--nl-green)] hover:underline"
        >
          {cta.label} →
        </Link>
      )}
    </div>
  );
}
