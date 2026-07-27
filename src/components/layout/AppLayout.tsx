import { useEffect } from "react";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { BottomBar } from "./BottomBar";
import { PageTransition } from "./PageTransition";
import { Toast } from "../ui/Toast";
import { AddAccountModal } from "../modals/AddAccountModal";
import { VersionPickerOverlay } from "../modals/VersionPickerOverlay";
import { NuvoxelLoginModal } from "../modals/NuvoxelLoginModal";
import { CreatePackModal } from "../modals/CreatePackModal";
import { AddFriendModal } from "../modals/AddFriendModal";
import { JavaPathModal } from "../modals/JavaPathModal";
import { useAppStore, useHasAccount } from "../../store/useAppStore";
import { useFriendsSync } from "../../hooks/useFriendsSync";
import { useGameSession } from "../../hooks/useGameSession";
import { useSocialBootstrap } from "../../hooks/useSocialBootstrap";
import { useAchievements } from "../../hooks/useAchievements";
import { useUpdater } from "../../hooks/useUpdater";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { UpdateBanner } from "../modals/UpdateBanner";
import { setI18nLocale, type Locale } from "../../i18n";

export function AppLayout() {
  const language = useAppStore((s) => s.language);
  const hasAccount = useHasAccount();
  const showAddAccountModal = useAppStore((s) => s.showAddAccountModal);
  const setShowAddAccountModal = useAppStore((s) => s.setShowAddAccountModal);
  const showVersionPicker = useAppStore((s) => s.showVersionPicker);
  const showCreatePackModal = useAppStore((s) => s.showCreatePackModal);
  const showNuvoxelLogin = useAppStore((s) => s.showNuvoxelLogin);
  const showAddFriendModal = useAppStore((s) => s.showAddFriendModal);
  const showJavaPathModal = useAppStore((s) => s.showJavaPathModal);

  useGameSession();
  useSocialBootstrap();
  useFriendsSync();
  useAchievements();
  useKeyboardShortcuts();
  const { update, installing, dismiss, dismissed, install } = useUpdater();

  const overlayOpen =
    showAddAccountModal ||
    showVersionPicker ||
    showNuvoxelLogin ||
    showCreatePackModal ||
    showAddFriendModal ||
    showJavaPathModal;

  useEffect(() => {
    setI18nLocale(language as Locale);
  }, [language]);

  useEffect(() => {
    if (!hasAccount && !showAddAccountModal && !showNuvoxelLogin) {
      const timer = setTimeout(() => setShowAddAccountModal(true), 600);
      return () => clearTimeout(timer);
    }
  }, [hasAccount, showAddAccountModal, showNuvoxelLogin, setShowAddAccountModal]);

  return (
    <div key={language} className="relative flex h-full flex-col bg-bg-primary">
      <div
        className={`app-shell-dim flex min-h-0 flex-1 flex-col ${
          overlayOpen ? "scale-[0.985] blur-md brightness-[0.55]" : "scale-100"
        }`}
      >
        <TitleBar />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="relative min-w-0 flex-1 overflow-hidden">
            <PageTransition />
          </main>
        </div>
        <BottomBar />
      </div>
      {update && !dismissed ? (
        <UpdateBanner
          update={update}
          installing={installing}
          onInstall={() => void install()}
          onDismiss={dismiss}
        />
      ) : null}
      <Toast />
      <VersionPickerOverlay />
      <NuvoxelLoginModal />
      <AddAccountModal />
      <CreatePackModal />
      <AddFriendModal />
      <JavaPathModal />
    </div>
  );
}
