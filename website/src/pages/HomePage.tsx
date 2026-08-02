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
  Shield,
  Globe,
  ArrowRight,
  Star,
  Gamepad2,
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
    { title: t("homeDevBtn1Title"), text: t("homeDevBtn1Text"), to: "/business", icon: Sparkles },
    { title: t("homeDevBtn2Title"), text: t("homeDevBtn2Text"), to: "/business", icon: Shield },
    { title: t("homeDevBtn3Title"), text: t("homeDevBtn3Text"), to: "/business", icon: Globe },
  ];

  const stats = [
    { value: "50K+", label: "Скинів доступно", icon: Palette },
    { value: "1.21.8", label: "Остання версія", icon: Gamepad2 },
    { value: "24/7", label: "Хмарний сервер", icon: Server },
    { value: "∞", label: "Модів та збірок", icon: Package },
  ];

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="home-hero relative overflow-hidden min-h-[85vh] flex items-center">
        <div className="particles-bg" />
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url(/bg-home.png)" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/70 to-[#0a0a0f]" />

        <div className="home-hero-content relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="section-label mb-4 animate-fade-up">{t("homeHeroLabel")}</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl animate-fade-up delay-100">
            {t("homeHeroTitle1")}
            <br />
            <span className="gradient-text">{t("homeHeroTitle2")}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-400 animate-fade-up delay-200">
            {t("homeHeroDesc")}
          </p>
          <div className="mt-8 flex flex-wrap gap-4 animate-fade-up delay-300">
            <Link to="/download" className="btn-primary animate-pulse-glow text-lg px-8 py-4">
              <Download className="h-6 w-6" />
              {t("homeDownloadWin")}
            </Link>
            <a
              href="https://discord.gg/"
              target="_blank"
              rel="noreferrer"
              className="btn-outline text-lg px-6 py-4"
            >
              <MessageCircle className="h-5 w-5" />
              {t("homeDiscord")}
            </a>
          </div>
          <p className="mt-6 text-sm text-zinc-500 animate-fade-in delay-500">{t("homeTagline")}</p>

          {/* Floating Stats Bar */}
          <div className="home-stats mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 animate-fade-up delay-600">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`glass-card glow-border flex items-center gap-3 p-4 animate-fade-up`}
                style={{ animationDelay: `${0.7 + i * 0.1}s` }}
              >
                <div className="rounded-xl bg-[var(--nl-green)]/10 p-2.5 text-[var(--nl-green)]">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="stat-number text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SPEED CARD ═══ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="glass-card glow-border p-10 text-center animate-fade-up relative overflow-hidden">
          <div className="animate-shimmer absolute inset-0 rounded-[1.25rem]" />
          <div className="relative">
            <Zap className="mx-auto h-12 w-12 text-[var(--nl-green)] animate-float" />
            <h2 className="mt-4 text-3xl font-bold">{t("homeFastTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-400">{t("homeFastDesc")}</p>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="section-label mb-2 animate-fade-up">{t("homeFeaturesLabel")}</p>
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl animate-fade-up delay-100">{t("homeFeaturesTitle")}</h2>
        <p className="mb-12 max-w-2xl text-zinc-400 animate-fade-up delay-200">{t("homeFeaturesDesc")}</p>

        <div className="grid gap-6 lg:grid-cols-3">
          <FeatureCard
            label={t("homeServersLabel")}
            icon={Server}
            title={t("homeServersTitle")}
            bullets={[t("homeServersBullet1"), t("homeServersBullet2")]}
            delay={0}
            mock={
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 transition-all hover:border-[var(--nl-green)]/30">
                <p className="text-xs text-zinc-500">HiTech RPG</p>
                <p className="font-semibold text-[var(--nl-green)]">
                  {t("homeServersMockPlayers", { count: "1 240" })}
                </p>
                <span className="mt-2 inline-block rounded-lg bg-[var(--nl-green)] px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-[var(--nl-green)]/20">
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
            delay={1}
            mock={
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm transition-all hover:border-[var(--nl-green)]/30">
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
            delay={2}
            mock={
              <div className="mt-4 flex gap-2">
                {(["boys", "anime", "popular"] as const).map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-[var(--nl-green)]/40 hover:text-[var(--nl-green)]"
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

      {/* ═══ DEV TOOLS ═══ */}
      <section className="border-y border-white/8 bg-[#08080c] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="section-label mb-2 animate-fade-up">{t("homeDevLabel")}</p>
          <h2 className="mb-12 text-3xl font-bold sm:text-4xl animate-fade-up delay-100">{t("homeDevTitle")}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {devTools.map((item, i) => (
              <div
                key={item.title}
                className="glass-card glow-border p-7 animate-fade-up group"
                style={{ animationDelay: `${0.2 + i * 0.15}s` }}
              >
                <div className="rounded-xl bg-[var(--nl-green)]/10 p-3 w-fit transition-transform group-hover:scale-110">
                  <item.icon className="h-6 w-6 text-[var(--nl-green)]" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{item.text}</p>
                <Link
                  to={item.to}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--nl-green)] hover:gap-2 transition-all"
                >
                  {t("homeGoTo")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STEPS ═══ */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="mb-14 text-center text-3xl font-bold sm:text-4xl animate-fade-up">
          {t("homeStepsTitle")}{" "}
          <span className="gradient-text">{t("homeStepsHighlight")}</span>
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="glass-card glow-border p-7 animate-fade-up group"
              style={{ animationDelay: `${0.2 + i * 0.15}s` }}
            >
              <span className="text-5xl font-black gradient-text opacity-40 group-hover:opacity-70 transition-opacity">
                {s.n}
              </span>
              <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="glass-card glow-border relative flex flex-col items-center gap-6 p-12 text-center overflow-hidden animate-fade-up">
          <div className="particles-bg" />
          <div className="relative">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-400 animate-float" style={{ animationDelay: "0s" }} />
              <Users className="h-14 w-14 text-[var(--nl-green)] mx-3" />
              <Star className="h-5 w-5 text-yellow-400 animate-float" style={{ animationDelay: "1s" }} />
            </div>
            <h2 className="text-3xl font-bold">{t("homeCtaTitle")}</h2>
            <p className="mt-3 text-zinc-400 max-w-lg mx-auto">
              Приєднуйся до спільноти гравців. Один акаунт — лаунчер, скіни, друзі та моди.
            </p>
            <Link to="/download" className="btn-primary mt-6 text-lg px-8 py-4 animate-pulse-glow">
              <Download className="h-6 w-6" />
              {t("homeDownloadWin")}
            </Link>
          </div>
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
  delay = 0,
}: {
  label: string;
  icon: typeof Server;
  title: string;
  bullets: string[];
  mock: React.ReactNode;
  cta?: { to: string; label: string };
  delay?: number;
}) {
  return (
    <div
      className="glass-card glow-border flex flex-col p-7 animate-fade-up group"
      style={{ animationDelay: `${0.2 + delay * 0.15}s` }}
    >
      <p className="section-label">{label}</p>
      <div className="mt-3 rounded-xl bg-[var(--nl-green)]/10 p-3 w-fit transition-transform group-hover:scale-110 group-hover:rotate-3">
        <Icon className="h-8 w-8 text-[var(--nl-green)]" />
      </div>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-zinc-400">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--nl-green)] shrink-0" />
            {b}
          </li>
        ))}
      </ul>
      {mock}
      {cta && (
        <Link
          to={cta.to}
          className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--nl-green)] hover:gap-2 transition-all"
        >
          {cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
