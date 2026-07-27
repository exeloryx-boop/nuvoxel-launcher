import { Loader2 } from "lucide-react";
import { translateLaunchProgress } from "../../i18n";
import { useTranslation } from "../../hooks/useTranslation";
import { useComfortableLayout } from "../../hooks/useComfortableLayout";
import { SLIDE_UP_PANEL } from "../../utils/animations";
import { SHIMMER_SURFACE } from "../../utils/shimmer";
import { useAppStore } from "../../store/useAppStore";

export function Toast() {
  const { t } = useTranslation();
  const comfortable = useComfortableLayout();
  const toastMessage = useAppStore((s) => s.toastMessage);
  const launchProgress = useAppStore((s) => s.launchProgress);
  const isPlaying = useAppStore((s) => s.isPlaying);

  if (!toastMessage) return null;

  const messages: Record<string, string> = {
    launching: t("launching"),
    launched: t("launched"),
    launchedWithSkin: t("launchedWithSkin"),
    launchedWithServer: t("launchedWithServer"),
    needAccount: t("needAccount"),
    installing: t("installing"),
    installed: t("installed"),
    installError: t("installError"),
    loginSuccess: t("loginSuccess"),
    packModDownloading: t("packModDownloading"),
    packModAdded: t("packModAdded"),
    packModError: t("packModError"),
    packModNoVersion: t("packModNoVersion"),
    packModAlreadyAdded: t("packModAlreadyAdded"),
    packOpenFolderError: t("packOpenFolderError"),
    packDeleted: t("packDeleted"),
    packDeleteError: t("packDeleteError"),
    packModsImported: t("packModsImported"),
    packResourcepacksImported: t("packResourcepacksImported"),
    packShadersImported: t("packShadersImported"),
    packAssetError: t("packAssetError"),
    packModImporting: t("packModImporting"),
    packDropInvalid: t("packDropInvalid"),
    packVanillaModsError: t("packVanillaModsError"),
    packNeedsLoader: t("packNeedsLoader"),
    installPartial: t("installPartial"),
    packModsSynced: t("packModsSynced"),
    packContentSynced: t("packContentSynced"),
    versionsReloaded: t("versionsReloaded"),
    versionShareCopied: t("versionShareCopied"),
    launchHistoryCleared: t("launchHistoryCleared"),
    friendAdded: t("friendAdded"),
    friendAddError: t("friendAddError"),
    friendNotFound: t("friendNotFound"),
    friendAlreadyAdded: t("friendAlreadyAdded"),
    friendSelfAdd: t("friendSelfAdd"),
    friendInvalidCode: t("friendInvalidCode"),
    friendRemoved: t("friendRemoved"),
    friendRemoveError: t("friendRemoveError"),
    nuvoxelSessionExpired: t("nuvoxelSessionExpired"),
    socialApiOffline: t("socialApiOffline"),
    registerSuccess: t("registerSuccess"),
    registerError: t("registerError"),
    nuvoxelLoginError: t("nuvoxelLoginError"),
    nuvoxelUserExists: t("nuvoxelUserExists"),
    nuvoxelInvalidUsername: t("nuvoxelInvalidUsername"),
    nuvoxelInvalidPassword: t("nuvoxelInvalidPassword"),
    modpackInstalling: t("modpackInstalling"),
    modpackInstalled: t("modpackInstalled"),
    modpackInstallError: t("modpackInstallError"),
    modpackCurseforgeUnsupported: t("modpackCurseforgeUnsupported"),
    modUpdateDone: t("modUpdateDone"),
    modUpdateNone: t("modUpdateNone"),
    modUpdateOneDone: t("modUpdateOneDone"),
    modUpdateFailed: t("modUpdateFailed"),
    modUpdatePartial: t("modUpdatePartial"),
  };

  const text =
    toastMessage === "launch-progress" && launchProgress
      ? translateLaunchProgress(launchProgress)
      : (messages[toastMessage] ?? toastMessage);

  const showLoader =
    isPlaying ||
    toastMessage === "installing" ||
    toastMessage === "modpackInstalling" ||
    toastMessage === "launching" ||
    toastMessage === "launch-progress" ||
    toastMessage === "packModDownloading" ||
    toastMessage === "packModImporting" ||
    toastMessage === "packAssetImporting";

  return (
    <div
      className={`fixed left-1/2 z-[100] -translate-x-1/2 ${SLIDE_UP_PANEL} ${
        comfortable ? "bottom-24" : "bottom-[5.5rem]"
      }`}
    >
      <div className={`${SHIMMER_SURFACE} flex items-center gap-3 rounded-xl border border-border bg-bg-card px-5 py-3 shadow-xl`}>
        {showLoader && (
          <Loader2 className="h-5 w-5 animate-spin-slow text-[var(--accent)]" />
        )}
        <span className="text-sm font-medium text-text-primary">{text}</span>
      </div>
    </div>
  );
}
