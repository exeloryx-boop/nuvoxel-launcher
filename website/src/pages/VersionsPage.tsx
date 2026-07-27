import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

const VERSIONS = [
  "1.21.4", "1.21.3", "1.21.1", "1.20.6", "1.20.4", "1.19.4",
  "1.18.2", "1.17.1", "1.16.5",
];

export function VersionsPage() {
  const { t } = useWebI18n();

  return (
    <PageShell
      label={t("versionsLabel")}
      title={t("versionsTitle")}
      subtitle={t("versionsSubtitle")}
    >
      <div className="flex flex-wrap gap-2">
        {VERSIONS.map((v) => (
          <span
            key={v}
            className="rounded-lg border border-white/10 bg-[#12121a] px-4 py-2 text-sm font-medium"
          >
            {v}
          </span>
        ))}
      </div>
      <p className="mt-6 text-sm text-zinc-500">{t("versionsNote")}</p>
    </PageShell>
  );
}
