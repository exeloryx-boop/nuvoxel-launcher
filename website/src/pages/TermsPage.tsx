import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function TermsPage() {
  const { t } = useWebI18n();

  return (
    <PageShell label={t("termsLabel")} title={t("termsTitle")}>
      <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-400">
        <p>{t("termsP1")}</p>
        <p>{t("termsP2")}</p>
        <p>© 2026 nuvoxel.net</p>
      </div>
    </PageShell>
  );
}
