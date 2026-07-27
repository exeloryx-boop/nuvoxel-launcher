import { Link } from "react-router-dom";
import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function FeaturesPage() {
  const { t } = useWebI18n();

  const features = [
    t("featuresList1"),
    t("featuresList2"),
    t("featuresList3"),
    t("featuresList4"),
    t("featuresList5"),
    t("featuresList6"),
  ];

  return (
    <PageShell label={t("featuresLabel")} title={t("featuresTitle")}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {features.map((f) => (
          <li
            key={f}
            className="glass-card flex items-center gap-3 px-4 py-3 text-sm"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--nl-green)]" />
            {f}
          </li>
        ))}
      </ul>
      <Link to="/download" className="btn-primary mt-10 inline-flex">
        {t("downloadLauncher")}
      </Link>
    </PageShell>
  );
}
