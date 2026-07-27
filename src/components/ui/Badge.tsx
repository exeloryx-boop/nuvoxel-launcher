import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "accent" | "warning" | "dev" | "beta";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const styles = {
    default: "bg-white/10 text-text-secondary",
    accent: "bg-[var(--accent)]/20 text-[var(--accent)]",
    warning: "bg-orange-500/20 text-orange-400",
    dev: "bg-white/10 text-text-muted text-[11px]",
    beta: "bg-orange-500/20 text-orange-400 text-[11px]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
