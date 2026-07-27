import { Link } from "react-router-dom";
import { Package, Search, Upload } from "lucide-react";
import { useWebI18n } from "../hooks/useWebI18n";

export function ModsPage() {
  const { t } = useWebI18n();

  return (
    <PageShell
      label={t("modsLabel")}
      title={t("modsTitle")}
      subtitle={t("modsSubtitle")}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: Upload, title: t("modsCard1Title"), text: t("modsCard1Text") },
          { icon: Search, title: t("modsCard2Title"), text: t("modsCard2Text") },
          { icon: Package, title: t("modsCard3Title"), text: t("modsCard3Text") },
        ].map((f) => (
          <div key={f.title} className="glass-card p-6">
            <f.icon className="h-8 w-8 text-[var(--nl-green)]" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-zinc-400">{f.text}</p>
          </div>
        ))}
      </div>
      <Link to="/download" className="btn-primary mt-10 inline-flex">
        {t("downloadLauncher")}
      </Link>
    </PageShell>
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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="section-label mb-2">{label}</p>
      <h1 className="text-4xl font-bold">{title}</h1>
      {subtitle && (
        <p className="mt-4 max-w-2xl text-lg text-zinc-400">{subtitle}</p>
      )}
      <div className="mt-10">{children}</div>
    </div>
  );
}
