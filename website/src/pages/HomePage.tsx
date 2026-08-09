import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  Download,
  Gamepad2,
  Palette,
  Play,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useWebI18n } from "../hooks/useWebI18n";

export function HomePage() {
  const { t, skinCategory } = useWebI18n();
  const features = [
    { icon: Server, label: t("homeServersLabel"), title: t("homeServersTitle"), text: t("homeServersBullet1") },
    { icon: Boxes, label: t("homeModsLabel"), title: t("homeModsTitle"), text: t("homeModsBullet1") },
    { icon: Palette, label: t("homeSkinsLabel"), title: t("homeSkinsTitle"), text: t("homeSkinsBullet1") },
  ];

  return (
    <div className="site-home">
      <section className="studio-hero">
        <div className="studio-hero-grid" />
        <div className="studio-orb studio-orb-one" />
        <div className="studio-orb studio-orb-two" />
        <div className="studio-hero-inner">
          <div className="studio-hero-copy">
            <div className="studio-eyebrow"><span /> {t("homeHeroLabel")}</div>
            <h1>{t("homeHeroTitle1")} <em>{t("homeHeroTitle2")}</em></h1>
            <p>{t("homeHeroDesc")}</p>
            <div className="studio-actions">
              <Link to="/download" className="studio-primary"><Download className="h-4 w-4" />{t("homeDownloadWin")}</Link>
              <Link to="/features" className="studio-secondary">{t("homeFeaturesTitle")}<ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="studio-trust"><ShieldCheck className="h-4 w-4" /><span>{t("homeTagline")}</span></div>
          </div>

          <div className="studio-console" aria-label="Nuvoxel launcher preview">
            <div className="studio-console-titlebar"><span className="studio-console-brand"><i /> NUVOXEL</span><span>— □ ×</span></div>
            <div className="studio-console-body">
              <aside><div className="studio-mark">N</div><i /><i /><i /><i /><i /></aside>
              <main>
                <div className="studio-console-head"><div><small>WELCOME BACK</small><strong>Ready to create?</strong></div><span>ONLINE</span></div>
                <div className="studio-game-card"><div className="studio-game-art"><Sparkles className="h-8 w-8" /></div><div><small>SELECTED PROFILE</small><h3>Nuvoxel Visual</h3><p>Minecraft 1.21.4 · Fabric</p><button><Play className="h-3.5 w-3.5 fill-current" /> PLAY NOW</button></div></div>
                <div className="studio-console-stats"><div><strong>24/7</strong><span>Community</span></div><div><strong>50K+</strong><span>Skins</span></div><div><strong>∞</strong><span>Possibilities</span></div></div>
              </main>
            </div>
          </div>
        </div>
      </section>

      <section className="studio-strip">
        <div><Zap className="h-5 w-5" /><span><b>{t("homeFastTitle")}</b>{t("homeFastDesc")}</span></div>
        <div><Gamepad2 className="h-5 w-5" /><span><b>1.21.4 – 26.2</b>Supported versions</span></div>
        <div><ShieldCheck className="h-5 w-5" /><span><b>One-click setup</b>Components installed automatically</span></div>
      </section>

      <section className="studio-section studio-features">
        <div className="studio-section-heading"><div><span className="studio-eyebrow"><span /> {t("homeFeaturesLabel")}</span><h2>{t("homeFeaturesTitle")}</h2></div><p>{t("homeFeaturesDesc")}</p></div>
        <div className="studio-feature-grid">
          {features.map((feature, index) => <article className="studio-feature" key={feature.title}><div className="studio-feature-number">0{index + 1}</div><feature.icon className="h-6 w-6" /><p>{feature.label}</p><h3>{feature.title}</h3><span>{feature.text}</span><Link to={index === 0 ? "/servers" : index === 1 ? "/mods" : "/skins"}>Explore <ArrowRight className="h-3.5 w-3.5" /></Link></article>)}
        </div>
      </section>

      <section className="studio-section studio-workflow">
        <div className="studio-workflow-card">
          <div><span className="studio-eyebrow"><span /> {t("homeStepsTitle")}</span><h2>{t("homeStepsHighlight")}</h2><p>{t("homeCtaTitle")}</p><Link to="/download" className="studio-primary"><Download className="h-4 w-4" />{t("homeDownloadWin")}</Link></div>
          <ol>
            <li><b>01</b><div><strong>{t("homeStep1Title")}</strong><span>{t("homeStep1Text")}</span></div></li>
            <li><b>02</b><div><strong>{t("homeStep2Title")}</strong><span>{t("homeStep2Text")}</span></div></li>
            <li><b>03</b><div><strong>{t("homeStep3Title")}</strong><span>{t("homeStep3Text")}</span></div></li>
          </ol>
        </div>
      </section>

      <section className="studio-section studio-skin-row"><div><span className="studio-eyebrow"><span /> {t("homeSkinsLabel")}</span><h2>{t("homeSkinsTitle")}</h2><p>{t("homeSkinsBullet2")}</p></div><div className="studio-tags">{(["popular", "anime", "fashion", "games"] as const).map((item) => <span key={item}>{skinCategory(item)}</span>)}</div></section>
    </div>
  );
}
