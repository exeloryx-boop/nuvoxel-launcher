import { useEffect } from "react";

function isDevToolsShortcut(event: KeyboardEvent): boolean {
  if (event.key === "F12") return true;

  if (!event.ctrlKey && !event.metaKey) return false;

  const key = event.key.toLowerCase();
  if (event.shiftKey && (key === "i" || key === "j" || key === "c")) return true;
  if (key === "u") return true;

  return false;
}

export function useDevToolsGuard() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isDevToolsShortcut(event)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);
}
