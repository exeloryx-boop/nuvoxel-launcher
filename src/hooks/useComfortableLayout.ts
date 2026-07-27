import { useEffect, useState } from "react";

import { useAppStore } from "../store/useAppStore";

/** Window must be at least this wide for the full two-column home layout. */
const MIN_WINDOW_WIDTH = 1440;
const MIN_MAIN_HEIGHT = 620;

function readUiScale(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--ui-scale")
    .trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function isComfortableViewport(): boolean {
  if (typeof window === "undefined") return true;

  const scale = readUiScale();
  const windowW = window.innerWidth / scale;
  const main = document.querySelector("main");
  const mainH = (main?.clientHeight ?? window.innerHeight) / scale;

  return windowW >= MIN_WINDOW_WIDTH && mainH >= MIN_MAIN_HEIGHT;
}

/** True when the window is large enough for the full (maximized) layout. */
export function useComfortableLayout(): boolean {
  const sidebarCompactPref = useAppStore((s) => s.sidebarCompact);
  const interfaceScale = useAppStore((s) => s.interfaceScale);
  const [comfortable, setComfortable] = useState(isComfortableViewport);

  useEffect(() => {
    const main = document.querySelector("main");

    const update = () => setComfortable(isComfortableViewport());

    update();
    window.addEventListener("resize", update);

    let ro: ResizeObserver | undefined;
    if (main) {
      ro = new ResizeObserver(update);
      ro.observe(main);
    }

    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [sidebarCompactPref, interfaceScale]);

  return comfortable;
}
