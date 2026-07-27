import { Link } from "react-router-dom";
import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function HelpPage() {
  const { t } = useWebI18n();

  const faq = [
    { q: t("helpQ1"), a: t("helpA1") },
    { q: t("helpQ2"), a: t("helpA2") },
    { q: t("helpQ3"), a: t("helpA3") },
  ];

  return (
    <PageShell label={t("helpLabel")} title={t("helpTitle")}>
      <div className="space-y-4">
        {faq.map((item) => (
          <details key={item.q} className="glass-card group p-5">
            <summary className="cursor-pointer font-semibold">{item.q}</summary>
            <p className="mt-3 text-sm text-zinc-400">{item.a}</p>
          </details>
        ))}
      </div>
      <Link to="/feedback" className="btn-outline mt-8 inline-flex">
        {t("footerFeedback")}
      </Link>
    </PageShell>
  );
}
