import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function BusinessPage() {
  const { t } = useWebI18n();

  const cards = [
    { title: t("businessCard1Title"), text: t("businessCard1Text") },
    { title: t("businessCard2Title"), text: t("businessCard2Text") },
    { title: t("businessCard3Title"), text: t("businessCard3Text") },
  ];

  return (
    <PageShell
      label={t("businessLabel")}
      title={t("businessTitle")}
      subtitle={t("businessSubtitle")}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((b) => (
          <div key={b.title} className="glass-card p-6">
            <h3 className="font-semibold">{b.title}</h3>
            <p className="mt-2 text-sm text-zinc-400">{b.text}</p>
            <span className="mt-4 inline-block text-sm text-[var(--nl-green)]">
              {t("businessContact")}
            </span>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
