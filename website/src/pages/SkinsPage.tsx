import { SkinCatalogGrid } from "../components/SkinCatalogGrid";
import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function SkinsPage() {
  const { t } = useWebI18n();

  return (
    <PageShell
      label={t("skinsLabel")}
      title={t("skinsTitle")}
      subtitle={t("skinsSubtitle")}
    >
      <SkinCatalogGrid />
    </PageShell>
  );
}
