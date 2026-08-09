import { Download, Globe, Key, Monitor, RefreshCw, Shield, Users } from "lucide-react";
import { SettingCard } from "../ui/SettingCard";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Badge } from "../ui/Badge";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import {
  checkCurseForgeAvailable,
  resetCurseForgeAvailabilityCache,
  verifyCurseForgeApiKey,
} from "../../services/curseforge";
import { useEffect, useState } from "react";

export function SettingsConnections() {
  const proxy = useAppStore((s) => s.proxy);
  const simultaneousDownloads = useAppStore((s) => s.simultaneousDownloads);
  const downloadMirror = useAppStore((s) => s.downloadMirror);
  const sslCheck = useAppStore((s) => s.sslCheck);
  const socialApiUrl = useAppStore((s) => s.socialApiUrl);
  const socialApiOnline = useAppStore((s) => s.socialApiOnline);
  const curseforgeApiKey = useAppStore((s) => s.curseforgeApiKey);
  const setProxy = useAppStore((s) => s.setProxy);
  const setSimultaneousDownloads = useAppStore((s) => s.setSimultaneousDownloads);
  const setDownloadMirror = useAppStore((s) => s.setDownloadMirror);
  const setSslCheck = useAppStore((s) => s.setSslCheck);
  const setSocialApiUrl = useAppStore((s) => s.setSocialApiUrl);
  const setCurseForgeApiKey = useAppStore((s) => s.setCurseForgeApiKey);
  const [cfStatus, setCfStatus] = useState<"unknown" | "checking" | "ok" | "missing" | "invalid">("unknown");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      resetCurseForgeAvailabilityCache();
      const ok = await checkCurseForgeAvailable();
      if (!cancelled) setCfStatus(ok ? "ok" : "missing");
    })();
    return () => {
      cancelled = true;
    };
  }, [curseforgeApiKey]);

  const verifyKey = async () => {
    setCfStatus("checking");
    resetCurseForgeAvailabilityCache();
    const configured = await checkCurseForgeAvailable();
    if (!configured) {
      setCfStatus("missing");
      return;
    }
    const valid = await verifyCurseForgeApiKey();
    setCfStatus(valid ? "ok" : "invalid");
  };

  return (
    <>
      <SettingCard
        icon={<Key className="h-5 w-5" />}
        title={t("curseforgeApiKey")}
        description={t("curseforgeApiKeyDesc")}
      >
        <input
          type="password"
          value={curseforgeApiKey}
          onChange={(e) => setCurseForgeApiKey(e.target.value)}
          placeholder={t("curseforgeApiKeyPlaceholder")}
          className="no-drag w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
        <p className="mt-2 text-xs text-text-muted">{t("curseforgeApiKeyHint")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void verifyKey()}
            disabled={cfStatus === "checking"}
            className="no-drag flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${cfStatus === "checking" ? "animate-spin" : ""}`} />
            {t("verifyCurseforgeKey")}
          </button>
          <p
            className={`text-xs ${cfStatus === "ok" ? "text-green-400" : cfStatus === "missing" || cfStatus === "invalid" ? "text-amber-400" : "text-text-muted"}`}
          >
            {cfStatus === "ok"
              ? t("curseforgeKeyOk")
              : cfStatus === "missing"
                ? t("curseforgeNoKey")
                : cfStatus === "invalid"
                  ? t("curseforgeKeyInvalid")
                  : t("curseforgeKeyChecking")}
          </p>
        </div>
      </SettingCard>

      <SettingCard
        icon={<Users className="h-5 w-5" />}
        title={t("socialApiUrl")}
        description={t("socialApiUrlDesc")}
      >
        <input
          type="url"
          value={socialApiUrl}
          onChange={(e) => setSocialApiUrl(e.target.value)}
          placeholder="https://nuvoxel-launcher-z6va.onrender.com"
          className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
        <p className="mt-2 text-xs text-text-muted">{t("socialApiHint")}</p>
        <p
          className={`mt-2 text-xs ${socialApiOnline ? "text-green-400" : "text-amber-400"}`}
        >
          {socialApiOnline ? t("socialApiOnlineStatus") : t("socialApiOffline")}
        </p>
      </SettingCard>

      <SettingCard
        icon={<Monitor className="h-5 w-5" />}
        title={t("proxyServer")}
        description={t("proxyServerDesc")}
      >
        <SegmentedControl
          options={[
            { value: "none" as const, label: t("proxyNone") },
            { value: "system" as const, label: t("proxySystem") },
            { value: "custom" as const, label: t("proxyCustom") },
          ]}
          value={proxy}
          onChange={setProxy}
        />
        <p className="mt-3 text-xs text-text-muted">{t("proxyRestartNote")}</p>
      </SettingCard>

      <SettingCard
        icon={<Download className="h-5 w-5" />}
        title={t("simultaneousDownloads")}
        description={t("simultaneousDownloadsDesc")}
      >
        <SegmentedControl
          options={[
            { value: 2 as const, label: "2" },
            { value: 3 as const, label: "3" },
            { value: 6 as const, label: "6" },
            { value: 10 as const, label: "10" },
            { value: 16 as const, label: "16" },
          ]}
          value={simultaneousDownloads}
          onChange={setSimultaneousDownloads}
        />
      </SettingCard>

      <SettingCard
        icon={<Globe className="h-5 w-5" />}
        title={
          <span className="flex items-center gap-2">
            {t("downloadMirror")}
            <Badge variant="dev">{t("soon")}</Badge>
          </span>
        }
        description={t("downloadMirrorDesc")}
      >
        <SegmentedControl
          options={[
            { value: "auto" as const, label: t("mirrorAuto") },
            { value: "europe" as const, label: t("mirrorEurope"), disabled: true },
            { value: "cis" as const, label: t("mirrorCis"), disabled: true },
          ]}
          value={downloadMirror}
          onChange={setDownloadMirror}
        />
      </SettingCard>

      <SettingCard
        icon={<Shield className="h-5 w-5" />}
        title={t("sslCheck")}
        description={t("sslCheckDesc")}
      >
        <div className="flex items-center gap-3">
          <ToggleSwitch checked={sslCheck} onChange={setSslCheck} />
          <span className="text-sm">{t("sslCheck")}</span>
        </div>
      </SettingCard>
    </>
  );
}
