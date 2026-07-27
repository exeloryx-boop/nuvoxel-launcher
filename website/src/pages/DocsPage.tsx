import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function DocsPage() {
  const { t } = useWebI18n();

  return (
    <PageShell label={t("docsLabel")} title={t("docsTitle")}>
      <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
        <section className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white">{t("docsQuickStart")}</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            <li>{t("docsStep1")}</li>
            <li>{t("docsStep2")}</li>
            <li>{t("docsStep3")}</li>
          </ol>
        </section>
        <section className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white">{t("docsApiTitle")}</h3>
          <p className="mt-2 text-sm text-zinc-400">
            {t("docsApiText")}{" "}
            <code className="rounded bg-black/40 px-1">nuvoxel://join/server-id</code>
          </p>
        </section>
      </div>
    </PageShell>
  );
}
