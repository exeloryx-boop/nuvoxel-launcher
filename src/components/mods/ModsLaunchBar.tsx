import { t } from "../../i18n";
import { VersionSelector } from "../modals/VersionSelector";
import { LoaderPicker } from "./LoaderPicker";

export function ModsLaunchBar() {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <VersionSelector className="min-w-[220px] flex-1" />
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {t("loaderLabel")}
        </p>
        <LoaderPicker clearPackOnChange />
      </div>
    </div>
  );
}
