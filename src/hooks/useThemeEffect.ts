import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { ACCENT_COLORS } from "../types";

export function useThemeEffect() {
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const fontSize = useAppStore((s) => s.fontSize);
  const systemTheme = useAppStore((s) => s.systemTheme);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const uiAnimations = useAppStore((s) => s.uiAnimations);
  const pageTransitions = useAppStore((s) => s.pageTransitions);
  const openAnimations = useAppStore((s) => s.openAnimations);
  const glassShimmer = useAppStore((s) => s.glassShimmer);
  const glassShimmerSpeed = useAppStore((s) => s.glassShimmerSpeed);
  const glassShimmerIntensity = useAppStore((s) => s.glassShimmerIntensity);
  const glassShimmerScope = useAppStore((s) => s.glassShimmerScope);
  const hoverEffects = useAppStore((s) => s.hoverEffects);
  const accentPulse = useAppStore((s) => s.accentPulse);
  const buttonGlowEffects = useAppStore((s) => s.buttonGlowEffects);
  const cardShadowIntensity = useAppStore((s) => s.cardShadowIntensity);
  const sidebarTransparency = useAppStore((s) => s.sidebarTransparency);
  const panelBorderGlow = useAppStore((s) => s.panelBorderGlow);
  const scrollbarStyle = useAppStore((s) => s.scrollbarStyle);
  const contentSpacing = useAppStore((s) => s.contentSpacing);
  const uiRoundness = useAppStore((s) => s.uiRoundness);
  const interfaceScale = useAppStore((s) => s.interfaceScale);
  const glassIntensity = useAppStore((s) => s.glassIntensity);
  const compactLists = useAppStore((s) => s.compactLists);

  useEffect(() => {
    const root = document.documentElement;
    const motionOff = reduceMotion;
    const shimmerOn = !motionOff && glassShimmer;

    let effectiveTheme = theme;
    if (systemTheme) {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
    }

    root.setAttribute("data-theme", effectiveTheme);
    root.setAttribute("data-accent", accentColor);
    root.setAttribute("data-roundness", uiRoundness);
    root.setAttribute("data-reduce-motion", motionOff ? "true" : "false");
    root.setAttribute("data-compact-lists", compactLists ? "true" : "false");
    root.setAttribute("data-content-spacing", contentSpacing);
    root.setAttribute("data-scrollbar", scrollbarStyle);
    root.setAttribute(
      "data-ui-animations",
      !motionOff && uiAnimations ? "true" : "false",
    );
    root.setAttribute(
      "data-page-transitions",
      !motionOff && pageTransitions ? "true" : "false",
    );
    root.setAttribute(
      "data-open-animations",
      !motionOff && openAnimations ? "true" : "false",
    );
    root.setAttribute(
      "data-glass-shimmer",
      shimmerOn ? glassShimmerScope : "off",
    );
    root.setAttribute(
      "data-hover-effects",
      !motionOff && hoverEffects ? "true" : "false",
    );
    root.setAttribute(
      "data-accent-pulse",
      !motionOff && accentPulse ? "true" : "false",
    );
    root.setAttribute(
      "data-button-glow",
      !motionOff && buttonGlowEffects ? "true" : "false",
    );
    root.setAttribute(
      "data-panel-border-glow",
      panelBorderGlow ? "true" : "false",
    );

    const scale = interfaceScale / 100;
    root.style.setProperty("--font-size-base", `${fontSize}px`);
    root.style.setProperty("--ui-scale", String(scale));
    root.style.setProperty(
      "--glass-blur",
      `${Math.round((glassIntensity / 100) * 32)}px`,
    );
    root.style.setProperty(
      "--glass-opacity",
      String(Math.min(0.65, 0.15 + (glassIntensity / 100) * 0.5)),
    );
    root.style.setProperty(
      "--sidebar-alpha",
      String(1 - sidebarTransparency / 100),
    );
    root.style.setProperty(
      "--card-shadow-alpha",
      String((cardShadowIntensity / 100) * 0.45),
    );
    root.style.setProperty(
      "--glass-shimmer-opacity",
      String(0.08 + (glassShimmerIntensity / 100) * 0.35),
    );

    const shimmerSec = 7 - (glassShimmerSpeed / 100) * 5;
    root.style.setProperty("--glass-shimmer-duration", `${shimmerSec}s`);
    root.style.setProperty(
      "--glass-shimmer-stagger",
      `${Math.max(0.4, shimmerSec / 6)}s`,
    );

    if (accentColor === "rgb") {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-hover");
    } else {
      const accent = ACCENT_COLORS[accentColor];
      root.style.setProperty("--accent", accent.hex);
      root.style.setProperty("--accent-hover", accent.hover);
    }
  }, [
    theme,
    accentColor,
    fontSize,
    systemTheme,
    reduceMotion,
    uiAnimations,
    pageTransitions,
    openAnimations,
    glassShimmer,
    glassShimmerSpeed,
    glassShimmerIntensity,
    glassShimmerScope,
    hoverEffects,
    accentPulse,
    buttonGlowEffects,
    cardShadowIntensity,
    sidebarTransparency,
    panelBorderGlow,
    scrollbarStyle,
    contentSpacing,
    uiRoundness,
    interfaceScale,
    glassIntensity,
    compactLists,
  ]);

  useEffect(() => {
    if (!systemTheme) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const root = document.documentElement;
      root.setAttribute("data-theme", media.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [systemTheme]);
}
