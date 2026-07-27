import type { ReactNode } from "react";
import { OVERLAY_BACKDROP, OVERLAY_PANEL } from "../../utils/animations";

interface BlurOverlayProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

export function BlurOverlay({
  open,
  onClose,
  children,
  className = "",
}: BlurOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-stretch justify-center">
      <div
        className={`${OVERLAY_BACKDROP} absolute inset-0 bg-black/50 backdrop-blur-xl`}
        onClick={onClose}
      />
      <div
        className={`no-drag ${OVERLAY_PANEL} relative z-10 flex w-full max-w-[1100px] flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function useAnyOverlayOpen() {
  // re-export pattern - consumers use store directly
}
