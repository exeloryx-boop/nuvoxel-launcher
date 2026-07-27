import { FormEvent, useState } from "react";
import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function FeedbackPage() {
  const { t } = useWebI18n();
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <PageShell label={t("feedbackLabel")} title={t("feedbackTitle")}>
      {sent ? (
        <p className="text-[var(--nl-green)]">{t("feedbackThanks")}</p>
      ) : (
        <form onSubmit={submit} className="glass-card max-w-lg space-y-4 p-6">
          <label className="block">
            <span className="text-sm text-zinc-400">Email</span>
            <input
              required
              type="email"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[var(--nl-green)]"
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-400">{t("feedbackMessage")}</span>
            <textarea
              required
              rows={5}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[var(--nl-green)]"
            />
          </label>
          <button type="submit" className="btn-primary">
            {t("feedbackSend")}
          </button>
        </form>
      )}
    </PageShell>
  );
}
