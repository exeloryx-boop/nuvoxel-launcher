import { Download, Monitor } from "lucide-react";
import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function DownloadPage() {
  const { t } = useWebI18n();

  return (
    <PageShell
      label={t("downloadLabel")}
      title={t("downloadTitle")}
      subtitle={t("downloadSubtitle")}
    >
      <div className="glass-card max-w-xl p-8">
        <Monitor className="h-12 w-12 text-[var(--nl-green)]" />
        <h3 className="mt-4 text-xl font-semibold">{t("downloadOs")}</h3>
        <p className="mt-2 text-sm text-zinc-400">{t("downloadMeta")}</p>
        <button type="button" className="btn-primary mt-6">
          <Download className="h-5 w-5" />
          {t("downloadBtn")}
        </button>
        <p className="mt-4 text-xs text-zinc-500">{t("downloadHint")}</p>
      </div>
    </PageShell>
  );
}
