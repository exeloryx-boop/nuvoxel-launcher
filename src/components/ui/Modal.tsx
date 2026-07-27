import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { t } from "../../i18n";
import { SHIMMER_SURFACE } from "../../utils/shimmer";
import { OVERLAY_BACKDROP, OVERLAY_PANEL } from "../../utils/animations";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: "md" | "lg" | "xl" | "full";
  showEsc?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  size = "lg",
  showEsc = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    md: "max-w-lg",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw]",
  }[size];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className={`${OVERLAY_BACKDROP} absolute inset-0 bg-black/50 backdrop-blur-xl`}
        onClick={onClose}
      />
      <div
        className={`no-drag ${SHIMMER_SURFACE} ${OVERLAY_PANEL} relative z-10 mx-4 w-full ${sizeClass} rounded-2xl border border-border bg-bg-card shadow-2xl`}
      >
        {(title || showEsc) && (
          <div className="flex items-start justify-between border-b border-border px-6 py-4">
            {title && (
              <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
            )}
            {showEsc && (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto flex flex-col items-center gap-0.5 rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
              >
                <X className="h-5 w-5" />
                <span className="text-[10px] uppercase tracking-wider">
                  {t("esc")}
                </span>
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
