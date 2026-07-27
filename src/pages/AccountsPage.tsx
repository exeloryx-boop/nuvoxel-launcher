import { LogIn, Plus, User, Users } from "lucide-react";
import { t } from "../i18n";
import { useActiveAccount, useAppStore, useHasAccount } from "../store/useAppStore";
import { Tabs } from "../components/ui/Tabs";
import { AccountCard } from "../components/ui/AccountCard";
import { SkinPicker } from "../components/skins/SkinPicker";
import { AchievementsPanel } from "../components/achievements/AchievementsPanel";
import { AccountCabinetPanel } from "../components/accounts/AccountCabinetPanel";

export function AccountsPage() {
  const account = useActiveAccount();
  const hasAccount = useHasAccount();
  const accountsTab = useAppStore((s) => s.accountsTab);
  const setAccountsTab = useAppStore((s) => s.setAccountsTab);
  const accounts = useAppStore((s) => s.accounts);
  const activeAccountId = useAppStore((s) => s.activeAccountId);
  const setActiveAccount = useAppStore((s) => s.setActiveAccount);
  const setShowAddAccountModal = useAppStore((s) => s.setShowAddAccountModal);
  const selectedSkin = useAppStore((s) => s.selectedSkin);

  if (!hasAccount) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
          <User className="h-12 w-12 text-text-muted" />
        </div>
        <h2 className="mt-6 text-2xl font-bold">{t("noAccountsYet")}</h2>
        <p className="mt-2 max-w-md text-center text-text-secondary">
          {t("noAccountsDesc")}
        </p>
        <button
          type="button"
          onClick={() => setShowAddAccountModal(true)}
          className="no-drag mt-6 flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
        >
          <LogIn className="h-4 w-4" />
          {t("addFirstAccount")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto p-6">
        <h1 className="mb-4 text-2xl font-bold">{t("accountsTitle")}</h1>

        <Tabs
          tabs={[
            { id: "cabinet", label: t("tabCabinet") },
            { id: "character", label: t("tabCharacter") },
            { id: "achievements", label: t("tabAchievements") },
          ]}
          activeTab={accountsTab}
          onChange={(id) =>
            setAccountsTab(id as "cabinet" | "character" | "achievements")
          }
        />

        {accountsTab === "cabinet" && account && (
          <AccountCabinetPanel
            accountId={account.id}
            username={account.username}
            accountType={account.type}
            coverUrl={account.coverUrl}
            skinUsername={selectedSkin?.username}
            skinModel={selectedSkin?.model ?? "classic"}
            capeId={selectedSkin?.capeId}
            customSkinData={selectedSkin?.customSkinData}
            customCapeData={selectedSkin?.customCapeData}
          />
        )}

        {accountsTab === "character" && <SkinPicker />}

        {accountsTab === "achievements" && <AchievementsPanel />}
      </div>

      <aside className="w-72 shrink-0 border-l border-border bg-bg-secondary p-4">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-text-muted" />
          <h3 className="text-sm font-semibold">{t("accountList")}</h3>
        </div>
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              active={acc.id === activeAccountId}
              onClick={() => setActiveAccount(acc.id)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAddAccountModal(true)}
          className="no-drag mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-card py-3 text-sm text-text-secondary transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          {t("addAccount")}
          <Plus className="h-4 w-4" />
        </button>
      </aside>
    </div>
  );
}
