import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function PrivacyPage() {
  const { t } = useWebI18n();

  return (
    <PageShell label={t("privacyLabel")} title={t("privacyTitle")}>
      <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-400">
        <p>{t("privacyP1")}</p>
        <p>{t("privacyP2")}</p>
        <p>© 2026 nuvoxel.net</p>
      </div>
    </PageShell>
  );
}
