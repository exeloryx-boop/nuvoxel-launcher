import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { playRetroSound } from "../utils/sound";

let startupPlayed = false;

export function useRetroSounds() {
  const retroSoundsEnabled = useAppStore((s) => s.retroSoundsEnabled);
  const startupRef = useRef(false);

  // Play startup chime once on the first user click (AudioContext needs gesture)
  useEffect(() => {
    if (!retroSoundsEnabled || startupPlayed) return;

    const onFirstInteraction = () => {
      if (!startupRef.current && !startupPlayed) {
        startupRef.current = true;
        startupPlayed = true;
        // Small delay so it doesn't overlap with the click sound
        setTimeout(() => playRetroSound("startup"), 120);
      }
      document.removeEventListener("click", onFirstInteraction);
      document.removeEventListener("keydown", onFirstInteraction);
    };

    document.addEventListener("click", onFirstInteraction, { once: true });
    document.addEventListener("keydown", onFirstInteraction, { once: true });

    return () => {
      document.removeEventListener("click", onFirstInteraction);
      document.removeEventListener("keydown", onFirstInteraction);
    };
  }, [retroSoundsEnabled]);

  // Global hover & click sound effects on interactive elements
  useEffect(() => {
    if (!retroSoundsEnabled) return;

    let lastHoveredElement: Element | null = null;
    let lastHoverTime = 0;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const interactive = target.closest(
        "button, a, [role='button'], [role='switch'], input[type='checkbox'], input[type='radio'], select, .interactive-hover"
      );
      if (!interactive) {
        lastHoveredElement = null;
        return;
      }

      const now = Date.now();
      if (interactive === lastHoveredElement || now - lastHoverTime < 60) {
        return;
      }

      // Check if disabled
      if ((interactive as any).disabled || interactive.classList.contains("disabled")) {
        return;
      }

      lastHoveredElement = interactive;
      lastHoverTime = now;
      playRetroSound("hover");
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const interactive = target.closest(
        "button, a, [role='button'], [role='switch'], input[type='checkbox'], input[type='radio'], select"
      );
      if (interactive) {
        // Check if disabled
        if ((interactive as any).disabled || interactive.classList.contains("disabled")) {
          return;
        }
        playRetroSound("click");
      }
    };

    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("click", handleClick, { passive: true });

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("click", handleClick);
    };
  }, [retroSoundsEnabled]);
}
