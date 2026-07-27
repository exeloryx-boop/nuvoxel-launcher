import { SLIDE_UP_PANEL } from "../../utils/animations";
import { useAppStore } from "../../store/useAppStore";
import { AccountCard } from "../ui/AccountCard";
import { t } from "../../i18n";
import { Plus } from "lucide-react";

export function AccountSwitcher() {
  const open = useAppStore((s) => s.showAccountSwitcher);
  const setOpen = useAppStore((s) => s.setShowAccountSwitcher);
  const accounts = useAppStore((s) => s.accounts);
  const activeAccountId = useAppStore((s) => s.activeAccountId);
  const setActiveAccount = useAppStore((s) => s.setActiveAccount);
  const setShowAddAccountModal = useAppStore((s) => s.setShowAddAccountModal);

  if (!open || accounts.length === 0) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div className={`no-drag ${SLIDE_UP_PANEL} fixed bottom-[84px] left-5 z-50 w-72 rounded-xl border border-border bg-bg-card p-3 shadow-2xl`}>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-text-muted">
          {t("accountList")}
        </p>
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              active={acc.id === activeAccountId}
              onClick={() => {
                setActiveAccount(acc.id);
                setOpen(false);
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setShowAddAccountModal(true);
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-text-secondary transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <Plus className="h-4 w-4" />
          {t("addAccount")}
        </button>
      </div>
    </>
  );
}
