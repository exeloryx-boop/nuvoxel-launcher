import { Check, Sparkles, Wand2 } from "lucide-react";
import { SettingCard } from "../ui/SettingCard";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { ColorSwatchPicker } from "../ui/ColorSwatchPicker";
import { Slider } from "../ui/Slider";
import { SegmentedControl } from "../ui/SegmentedControl";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { FONT_SIZES, type ContentSpacing, type GlassShimmerScope, type HomeBackgroundPreset, type ScrollbarStyle, type UiRoundness } from "../../types";
import { SHIMMER_SURFACE } from "../../utils/shimmer";
import {
  HOME_BACKGROUND_PRESETS,
  getHomeBackgroundStyle,
} from "../../utils/homeBackgrounds";

export function SettingsAppearance() {
  const theme = useAppStore((s) => s.theme);
  const systemTheme = useAppStore((s) => s.systemTheme);
  const accentColor = useAppStore((s) => s.accentColor);
  const fontSize = useAppStore((s) => s.fontSize);
  const streamerMode = useAppStore((s) => s.streamerMode);
  const setTheme = useAppStore((s) => s.setTheme);
  const setSystemTheme = useAppStore((s) => s.setSystemTheme);
  const setAccentColor = useAppStore((s) => s.setAccentColor);
  const setFontSize = useAppStore((s) => s.setFontSize);
  const setStreamerMode = useAppStore((s) => s.setStreamerMode);
  const homeBackgroundEnabled = useAppStore((s) => s.homeBackgroundEnabled);
  const homeBlurPercent = useAppStore((s) => s.homeBlurPercent);
  const homeDimPercent = useAppStore((s) => s.homeDimPercent);
  const setHomeBackgroundEnabled = useAppStore((s) => s.setHomeBackgroundEnabled);
  const setHomeBlurPercent = useAppStore((s) => s.setHomeBlurPercent);
  const setHomeDimPercent = useAppStore((s) => s.setHomeDimPercent);
  const homeBackgroundPreset = useAppStore((s) => s.homeBackgroundPreset);
  const sidebarCompact = useAppStore((s) => s.sidebarCompact);
  const sidebarGlow = useAppStore((s) => s.sidebarGlow);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const uiAnimations = useAppStore((s) => s.uiAnimations);
  const pageTransitions = useAppStore((s) => s.pageTransitions);
  const openAnimations = useAppStore((s) => s.openAnimations);
  const glassShimmer = useAppStore((s) => s.glassShimmer);
  const glassShimmerSpeed = useAppStore((s) => s.glassShimmerSpeed);
  const glassShimmerIntensity = useAppStore((s) => s.glassShimmerIntensity);
  const glassShimmerScope = useAppStore((s) => s.glassShimmerScope);
  const buttonGlowEffects = useAppStore((s) => s.buttonGlowEffects);
  const cardShadowIntensity = useAppStore((s) => s.cardShadowIntensity);
  const sidebarTransparency = useAppStore((s) => s.sidebarTransparency);
  const panelBorderGlow = useAppStore((s) => s.panelBorderGlow);
  const scrollbarStyle = useAppStore((s) => s.scrollbarStyle);
  const contentSpacing = useAppStore((s) => s.contentSpacing);
  const hoverEffects = useAppStore((s) => s.hoverEffects);
  const accentPulse = useAppStore((s) => s.accentPulse);
  const uiRoundness = useAppStore((s) => s.uiRoundness);
  const interfaceScale = useAppStore((s) => s.interfaceScale);
  const glassIntensity = useAppStore((s) => s.glassIntensity);
  const showHomeStats = useAppStore((s) => s.showHomeStats);
  const showLauncherTips = useAppStore((s) => s.showLauncherTips);
  const setHomeBackgroundPreset = useAppStore((s) => s.setHomeBackgroundPreset);
  const setSidebarCompact = useAppStore((s) => s.setSidebarCompact);
  const setSidebarGlow = useAppStore((s) => s.setSidebarGlow);
  const setReduceMotion = useAppStore((s) => s.setReduceMotion);
  const setUiAnimations = useAppStore((s) => s.setUiAnimations);
  const setPageTransitions = useAppStore((s) => s.setPageTransitions);
  const setOpenAnimations = useAppStore((s) => s.setOpenAnimations);
  const setGlassShimmer = useAppStore((s) => s.setGlassShimmer);
  const setGlassShimmerSpeed = useAppStore((s) => s.setGlassShimmerSpeed);
  const setGlassShimmerIntensity = useAppStore((s) => s.setGlassShimmerIntensity);
  const setGlassShimmerScope = useAppStore((s) => s.setGlassShimmerScope);
  const setButtonGlowEffects = useAppStore((s) => s.setButtonGlowEffects);
  const setCardShadowIntensity = useAppStore((s) => s.setCardShadowIntensity);
  const setSidebarTransparency = useAppStore((s) => s.setSidebarTransparency);
  const setPanelBorderGlow = useAppStore((s) => s.setPanelBorderGlow);
  const setScrollbarStyle = useAppStore((s) => s.setScrollbarStyle);
  const setContentSpacing = useAppStore((s) => s.setContentSpacing);
  const setHoverEffects = useAppStore((s) => s.setHoverEffects);
  const setAccentPulse = useAppStore((s) => s.setAccentPulse);
  const setUiRoundness = useAppStore((s) => s.setUiRoundness);
  const setInterfaceScale = useAppStore((s) => s.setInterfaceScale);
  const setGlassIntensity = useAppStore((s) => s.setGlassIntensity);
  const setShowHomeStats = useAppStore((s) => s.setShowHomeStats);
  const setShowLauncherTips = useAppStore((s) => s.setShowLauncherTips);

  const roundnessOptions: { id: UiRoundness; label: string }[] = [
    { id: "sharp", label: t("uiRoundnessSharp") },
    { id: "default", label: t("uiRoundnessDefault") },
    { id: "round", label: t("uiRoundnessRound") },
  ];

  return (
    <>
      <SettingCard title={t("launcherTheme")}>
        <div className="grid grid-cols-2 gap-4">
          <ThemePreview
            label={t("lightTheme")}
            variant="light"
            selected={theme === "light"}
            onClick={() => setTheme("light")}
          />
          <ThemePreview
            label={t("darkTheme")}
            variant="dark"
            selected={theme === "dark"}
            onClick={() => setTheme("dark")}
          />
        </div>
      </SettingCard>

      <SettingCard title={t("systemTheme")} description={t("systemThemeDesc")}>
        <div className="flex justify-end">
          <ToggleSwitch checked={systemTheme} onChange={setSystemTheme} />
        </div>
      </SettingCard>

      <SettingCard title={t("colorAccent")} description={t("colorAccentDesc")}>
        <ColorSwatchPicker value={accentColor} onChange={setAccentColor} />
      </SettingCard>

      <SettingCard title={t("textSize")} description={t("textSizeDesc")}>
        <Slider
          min={12}
          max={18}
          step={2}
          value={fontSize}
          onChange={setFontSize}
          marks={FONT_SIZES.map((s) => ({ value: s, label: `${s}px` }))}
        />
      </SettingCard>

      <SettingCard
        icon={<Wand2 className="h-5 w-5" />}
        title={t("effectsAndAnimations")}
        description={t("effectsAndAnimationsDesc")}
      >
        <div className="mb-5 overflow-hidden rounded-2xl border border-border">
          <p className="border-b border-border px-4 py-2 text-xs font-medium text-text-muted">
            {t("glassPreview")}
          </p>
          <div className="relative bg-gradient-to-br from-[var(--accent)]/20 via-bg-primary to-bg-secondary p-6">
            <div className={`glass-card ${SHIMMER_SURFACE} max-w-sm rounded-2xl p-5`}>
              <p className="relative z-[3] text-sm font-semibold text-text-primary">
                Nuvoxel Launcher
              </p>
              <p className="relative z-[3] mt-1 text-xs text-text-secondary">
                {t("glassShimmerDesc")}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <EffectToggle
            label={t("reduceMotion")}
            hint={t("reduceMotionDesc")}
            checked={reduceMotion}
            onChange={setReduceMotion}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <EffectToggle
              label={t("uiAnimations")}
              hint={t("uiAnimationsDesc")}
              checked={uiAnimations}
              disabled={reduceMotion}
              onChange={setUiAnimations}
            />
            <EffectToggle
              label={t("pageTransitions")}
              hint={t("pageTransitionsDesc")}
              checked={pageTransitions}
              disabled={reduceMotion}
              onChange={setPageTransitions}
            />
            <EffectToggle
              label={t("openAnimations")}
              hint={t("openAnimationsDesc")}
              checked={openAnimations}
              disabled={reduceMotion}
              onChange={setOpenAnimations}
            />
            <EffectToggle
              label={t("glassShimmer")}
              hint={t("glassShimmerDesc")}
              checked={glassShimmer}
              disabled={reduceMotion}
              onChange={setGlassShimmer}
            />
            <EffectToggle
              label={t("buttonGlowEffects")}
              hint={t("buttonGlowEffectsDesc")}
              checked={buttonGlowEffects}
              disabled={reduceMotion}
              onChange={setButtonGlowEffects}
            />
            <EffectToggle
              label={t("hoverEffects")}
              hint={t("hoverEffectsDesc")}
              checked={hoverEffects}
              disabled={reduceMotion}
              onChange={setHoverEffects}
            />
            <EffectToggle
              label={t("accentPulse")}
              hint={t("accentPulseDesc")}
              checked={accentPulse}
              disabled={reduceMotion}
              onChange={setAccentPulse}
            />
          </div>
          <div className={glassShimmer && !reduceMotion ? "space-y-4" : "space-y-4 opacity-50"}>
            <div>
              <p className="mb-2 text-sm text-text-secondary">{t("glassShimmerScope")}</p>
              <SegmentedControl<GlassShimmerScope>
                value={glassShimmerScope}
                onChange={setGlassShimmerScope}
                options={[
                  { value: "all", label: t("glassShimmerScopeAll") },
                  { value: "cards", label: t("glassShimmerScopeCards") },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-text-secondary">
                {t("glassShimmerSpeed")}: {glassShimmerSpeed}%
              </p>
              <Slider
                min={20}
                max={100}
                step={5}
                value={glassShimmerSpeed}
                onChange={setGlassShimmerSpeed}
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-text-secondary">
                {t("glassShimmerIntensity")}: {glassShimmerIntensity}%
              </p>
              <Slider
                min={0}
                max={100}
                step={5}
                value={glassShimmerIntensity}
                onChange={setGlassShimmerIntensity}
              />
            </div>
          </div>
        </div>
      </SettingCard>

      <SettingCard
        icon={<Sparkles className="h-5 w-5" />}
        title={t("advancedCustomization")}
        description={t("advancedCustomizationDesc")}
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm text-text-secondary">{t("uiRoundness")}</p>
            <SegmentedControl
              value={uiRoundness}
              onChange={setUiRoundness}
              options={roundnessOptions.map((o) => ({
                value: o.id,
                label: o.label,
              }))}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-text-secondary">
              {t("interfaceScale")}: {interfaceScale}%
            </p>
            <Slider min={85} max={115} step={5} value={interfaceScale} onChange={setInterfaceScale} />
          </div>
          <div>
            <p className="mb-2 text-sm text-text-secondary">
              {t("glassIntensity")}: {glassIntensity}%
            </p>
            <Slider min={0} max={100} step={5} value={glassIntensity} onChange={setGlassIntensity} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated/50 px-4 py-3">
              <span className="text-sm text-text-secondary">{t("sidebarCompact")}</span>
              <ToggleSwitch checked={sidebarCompact} onChange={setSidebarCompact} />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated/50 px-4 py-3">
              <span className="text-sm text-text-secondary">{t("sidebarGlow")}</span>
              <ToggleSwitch checked={sidebarGlow} onChange={setSidebarGlow} />
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm text-text-secondary">
              {t("cardShadowIntensity")}: {cardShadowIntensity}%
            </p>
            <Slider min={0} max={100} step={5} value={cardShadowIntensity} onChange={setCardShadowIntensity} />
          </div>
          <div>
            <p className="mb-2 text-sm text-text-secondary">
              {t("sidebarTransparency")}: {sidebarTransparency}%
            </p>
            <Slider min={0} max={80} step={5} value={sidebarTransparency} onChange={setSidebarTransparency} />
          </div>
          <div>
            <p className="mb-2 text-sm text-text-secondary">{t("contentSpacing")}</p>
            <SegmentedControl<ContentSpacing>
              value={contentSpacing}
              onChange={setContentSpacing}
              options={[
                { value: "tight", label: t("contentSpacingTight") },
                { value: "normal", label: t("contentSpacingNormal") },
                { value: "relaxed", label: t("contentSpacingRelaxed") },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-text-secondary">{t("scrollbarStyle")}</p>
            <SegmentedControl<ScrollbarStyle>
              value={scrollbarStyle}
              onChange={setScrollbarStyle}
              options={[
                { value: "default", label: t("scrollbarDefault") },
                { value: "thin", label: t("scrollbarThin") },
                { value: "hidden", label: t("scrollbarHidden") },
              ]}
            />
          </div>
          <EffectToggle
            label={t("panelBorderGlow")}
            hint={t("panelBorderGlowDesc")}
            checked={panelBorderGlow}
            onChange={setPanelBorderGlow}
          />
        </div>
      </SettingCard>

      <SettingCard
        icon={<Sparkles className="h-5 w-5" />}
        title={t("homeScreenSettings")}
        description={t("homeScreenSettingsDesc")}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-sm text-text-secondary">{t("showHomeStats")}</span>
          <ToggleSwitch checked={showHomeStats} onChange={setShowHomeStats} />
        </div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-sm text-text-secondary">{t("homeBackgroundImage")}</span>
          <ToggleSwitch
            checked={homeBackgroundEnabled}
            onChange={setHomeBackgroundEnabled}
          />
        </div>
        <div className="mb-4">
          <p className="mb-2 text-sm text-text-secondary">{t("homeBackgroundPreset")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {HOME_BACKGROUND_PRESETS.map(({ id, labelKey }) => {
              const style = getHomeBackgroundStyle(id);
              const selected = homeBackgroundPreset === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setHomeBackgroundPreset(id)}
                  className={`no-drag relative overflow-hidden rounded-xl border-2 p-2 text-left transition ${
                    selected
                      ? "border-[var(--accent)]"
                      : "border-border hover:border-white/20"
                  }`}
                >
                  <div
                    className="mb-2 h-12 rounded-lg bg-cover bg-center"
                    style={{
                      backgroundImage: style.image
                        ? `url(${style.image}), ${style.gradient}`
                        : style.gradient,
                    }}
                  />
                  <span className="text-[11px] font-medium leading-tight">
                    {t(labelKey as keyof typeof import("../../i18n/uk").uk)}
                  </span>
                  {selected ? (
                    <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[var(--accent)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        {homeBackgroundEnabled ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-start">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm text-text-secondary">
                  {t("homeBlurAmount")}: {homeBlurPercent}%
                </p>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={homeBlurPercent}
                  onChange={setHomeBlurPercent}
                />
              </div>
              <div>
                <p className="mb-2 text-sm text-text-secondary">
                  {t("homeDimAmount")}: {homeDimPercent}%
                </p>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={homeDimPercent}
                  onChange={setHomeDimPercent}
                />
              </div>
            </div>
            <HomeScreenPreview
              enabled={homeBackgroundEnabled}
              preset={homeBackgroundPreset}
              blurPercent={homeBlurPercent}
              dimPercent={homeDimPercent}
            />
          </div>
        ) : (
          <HomeScreenPreview
            enabled={false}
            preset={homeBackgroundPreset}
            blurPercent={homeBlurPercent}
            dimPercent={homeDimPercent}
          />
        )}
      </SettingCard>

      <SettingCard title={t("launcherTipsSetting")} description={t("launcherTipsSettingDesc")}>
        <div className="flex justify-end">
          <ToggleSwitch checked={showLauncherTips} onChange={setShowLauncherTips} />
        </div>
      </SettingCard>

      <SettingCard title={t("streamerMode")} description={t("streamerModeDesc")}>
        <div className="grid grid-cols-2 gap-4">
          <StreamerCard
            label={t("showAll")}
            selected={streamerMode === "show"}
            onClick={() => setStreamerMode("show")}
            masked={false}
          />
          <StreamerCard
            label={t("hideAll")}
            selected={streamerMode === "hide"}
            onClick={() => setStreamerMode("hide")}
            masked
          />
        </div>
      </SettingCard>
    </>
  );
}

function EffectToggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated/50 px-4 py-3 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0">
        <span className="text-sm text-text-secondary">{label}</span>
        {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
      </div>
      <ToggleSwitch checked={checked} disabled={disabled} onChange={onChange} />
    </label>
  );
}

function ThemePreview({
  label,
  variant,
  selected,
  onClick,
}: {
  label: string;
  variant: "light" | "dark";
  selected: boolean;
  onClick: () => void;
}) {
  const isDark = variant === "dark";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`no-drag relative overflow-hidden rounded-xl border-2 p-4 text-left transition ${
        selected
          ? "border-[var(--accent)]"
          : "border-border hover:border-white/20"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]">
          <Check className="h-4 w-4 text-white" strokeWidth={3} />
        </div>
      )}
      <div
        className={`mb-3 h-20 rounded-lg ${isDark ? "bg-[#0a0a0f]" : "bg-[#f4f4f5]"}`}
      >
        <div className="flex h-full flex-col gap-1 p-2">
          <div
            className={`h-2 w-8 rounded ${isDark ? "bg-white/20" : "bg-black/10"}`}
          />
          <div
            className={`h-2 w-12 rounded ${isDark ? "bg-white/10" : "bg-black/5"}`}
          />
        </div>
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function HomeScreenPreview({
  enabled,
  preset,
  blurPercent,
  dimPercent,
}: {
  enabled: boolean;
  preset: HomeBackgroundPreset;
  blurPercent: number;
  dimPercent: number;
}) {
  const blurPx = (blurPercent / 100) * 24;
  const bg = getHomeBackgroundStyle(preset);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-elevated">
      <p className="border-b border-border px-3 py-2 text-xs font-medium text-text-muted">
        {t("homeScreenPreview")}
      </p>
      <div className="relative aspect-[16/10] min-h-[140px] overflow-hidden">
        {enabled && preset !== "none" ? (
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center"
            style={{
              backgroundImage: bg.image
                ? `url(${bg.image}), ${bg.gradient}`
                : bg.gradient,
              filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-bg-primary" />
        )}
        <div
          className="absolute inset-0 bg-bg-primary"
          style={{ opacity: enabled ? dimPercent / 100 : 1 }}
        />
        {enabled ? (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-bg-primary/80" />
        ) : null}
        <div className="relative z-10 flex h-full flex-col justify-end p-3">
          <span className="w-fit rounded-md bg-black/45 px-2 py-1 text-[11px] font-medium text-text-primary backdrop-blur-sm">
            Nuvoxel Launcher
          </span>
        </div>
      </div>
    </div>
  );
}

function StreamerCard({
  label,
  selected,
  onClick,
  masked,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  masked: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`no-drag rounded-xl border-2 p-4 text-left transition ${
        selected ? "border-[var(--accent)]" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`h-4 w-4 rounded-full border-2 ${
            selected
              ? "border-[var(--accent)] bg-[var(--accent)]"
              : "border-white/30"
          }`}
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="space-y-1 text-xs text-text-secondary">
        {masked ? (
          <>
            <div className="h-3 w-24 rounded bg-white/15" />
            <div className="h-3 w-16 rounded bg-white/15" />
          </>
        ) : (
          <>
            <p>{t("exampleEmail")}</p>
            <p>{t("exampleId")}</p>
          </>
        )}
      </div>
    </button>
  );
}
