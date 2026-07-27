import type { ReactNode } from "react";
import { Badge } from "./Badge";
import { SHIMMER_SURFACE } from "../../utils/shimmer";

interface SettingCardProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: string;
  badge?: string;
  children: ReactNode;
}

export function SettingCard({
  icon,
  title,
  description,
  badge,
  children,
}: SettingCardProps) {
  return (
    <div className={`${SHIMMER_SURFACE} rounded-xl border border-border bg-bg-card p-5`}>
      <div className="relative z-10">
      <div className="mb-4 flex items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-text-primary">{title}</h3>
            {badge && <Badge variant="dev">{badge}</Badge>}
          </div>
          {description && (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          )}
        </div>
      </div>
      {children}
      </div>
    </div>
  );
}
