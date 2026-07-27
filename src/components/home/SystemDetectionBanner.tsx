import { Cpu, X, Zap } from "lucide-react";
import { useSystemDetection } from "../../hooks/useSystemDetection";
import { t } from "../../i18n";

export function SystemDetectionBanner() {
  const { systemInfo, showSuggestion, acceptSuggestion, dismissSuggestion } =
    useSystemDetection();

  if (!showSuggestion || !systemInfo) return null;

  const ramLabel = systemInfo.ramGb
    ? `${systemInfo.ramGb} GB RAM`
    : `${systemInfo.cpuCores} CPU`;

  return (
    <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-500 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <Cpu className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-200">
              {t("systemDetected")}
            </h3>
            <p className="text-sm text-amber-300/80">
              {t("systemDetectedDesc").replace("{specs}", ramLabel)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissSuggestion}
          className="no-drag shrink-0 rounded-lg p-1.5 text-amber-400/60 transition hover:bg-amber-500/20 hover:text-amber-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={acceptSuggestion}
          className="no-drag flex items-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/30"
        >
          <Zap className="h-4 w-4" />
          {t("applyLowEndSettings")}
        </button>
        <button
          type="button"
          onClick={dismissSuggestion}
          className="no-drag rounded-xl border border-amber-500/20 px-4 py-2 text-sm text-amber-300/70 transition hover:bg-amber-500/10"
        >
          {t("keepCurrentSettings")}
        </button>
      </div>
      <p className="mt-2 text-xs text-amber-400/60">
        {t("suggestedMemory").replace("{mb}", String(systemInfo.suggestedMemoryMb))}
      </p>
    </div>
  );
}
