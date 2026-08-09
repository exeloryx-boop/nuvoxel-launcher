import { Link } from "react-router-dom";
import { Package, Search, Upload, Download, Sparkles, Layers, ShieldCheck, ArrowRight } from "lucide-react";
import { useWebI18n } from "../hooks/useWebI18n";

export function ModsPage() {
  const { t } = useWebI18n();

  const features = [
    {
      icon: Upload,
      title: t("modsCard1Title"),
      text: t("modsCard1Text"),
      badge: "Один клік",
      color: "from-purple-500/20 to-indigo-600/10",
      border: "border-purple-500/30",
      iconColor: "text-purple-400",
    },
    {
      icon: Search,
      title: t("modsCard2Title"),
      text: t("modsCard2Text"),
      badge: "Вбудований пошук",
      color: "from-emerald-500/20 to-teal-600/10",
      border: "border-emerald-500/30",
      iconColor: "text-[var(--studio-mint)]",
    },
    {
      icon: Package,
      title: t("modsCard3Title"),
      text: t("modsCard3Text"),
      badge: "Claude AI Модерація",
      color: "from-amber-500/20 to-orange-600/10",
      border: "border-amber-500/30",
      iconColor: "text-amber-400",
    },
  ];

  const popularCats = [
    { name: "Оптимізація (Sodium, Lithium)", count: "120+ модів", icon: ZapIcon },
    { name: "Шейдери & Графіка (Iris, Complementary)", count: "80+ шейдерів", icon: Sparkles },
    { name: "Техніка & Автоматизація (Create, AE2)", count: "250+ модів", icon: Layers },
    { name: "Пригоди & Нові виміри (Twilight, Alex's Mobs)", count: "180+ модів", icon: Package },
  ];

  return (
    <PageShell
      label={t("modsLabel")}
      title={t("modsTitle")}
      subtitle={t("modsSubtitle")}
    >
      {/* Primary Feature Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="glass-card group relative overflow-hidden p-7 animate-fade-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* Background gradient on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className={`rounded-2xl bg-white/5 p-3.5 border ${f.border} ${f.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-semibold text-zinc-400">
                  {f.badge}
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold text-white tracking-tight">{f.title}</h3>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{f.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories Spotlight */}
      <div className="mt-14">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[var(--studio-mint)]" />
          Популярні каталоги модів у Nuvoxel Launcher
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {popularCats.map((cat) => (
            <div key={cat.name} className="glass-card hover-lift p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                  <cat.icon className="h-5 w-5 text-zinc-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">{cat.name}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{cat.count}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Call to action */}
      <div className="mt-12 rounded-3xl border border-[var(--studio-mint)]/30 bg-gradient-to-r from-[var(--studio-mint)]/10 via-emerald-900/10 to-transparent p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-white">Готові встановити моди в один клік?</h3>
          <p className="text-sm text-zinc-400 mt-1">Завантажте Nuvoxel Launcher і виберіть моди прямо в інтерфейсі програми.</p>
        </div>
        <Link to="/download" className="btn-primary shrink-0 px-6 py-3.5 text-sm font-bold shadow-xl shadow-[var(--studio-mint)]/20">
          <Download className="h-4 w-4" />
          {t("downloadLauncher")}
        </Link>
      </div>
    </PageShell>
  );
}

function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export function PageShell({
  label,
  title,
  subtitle,
  children,
}: {
  label: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="site-page-shell mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="site-page-heading">
        <p className="section-label mb-2">{label}</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">{title}</h1>
      </div>
      {subtitle && (
        <p className="mt-4 max-w-2xl text-lg text-zinc-400 leading-relaxed">{subtitle}</p>
      )}
      <div className="mt-10">{children}</div>
    </div>
  );
}
