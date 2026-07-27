import { Check } from "lucide-react";
import type { Account } from "../../types";
import { MinecraftAvatar } from "./MinecraftAvatar";

interface AccountCardProps {
  account: Account;
  active: boolean;
  onClick: () => void;
}

export function AccountCard({ account, active, onClick }: AccountCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`no-drag flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/10"
          : "border-border bg-bg-elevated hover:border-white/15"
      }`}
    >
      <MinecraftAvatar username={account.username} size={36} />
      <span className="flex-1 font-medium text-text-primary">
        {account.username}
      </span>
      {active && <Check className="h-5 w-5 text-[var(--accent)]" />}
    </button>
  );
}
