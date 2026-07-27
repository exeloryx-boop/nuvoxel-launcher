import { MessageCircle, Send, Video } from "lucide-react";
import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function CommunityPage() {
  const { t } = useWebI18n();

  const links = [
    {
      icon: MessageCircle,
      label: "Discord",
      href: "https://discord.gg/",
      text: t("communityDiscord"),
    },
    {
      icon: Send,
      label: "Telegram",
      href: "https://t.me/",
      text: t("communityTelegram"),
    },
    {
      icon: Video,
      label: "YouTube",
      href: "https://youtube.com/",
      text: t("communityYoutube"),
    },
  ];

  return (
    <PageShell
      label={t("communityLabel")}
      title={t("communityTitle")}
      subtitle={t("communitySubtitle")}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="glass-card block p-6 transition hover:border-white/20"
          >
            <l.icon className="h-8 w-8 text-[var(--nl-green)]" />
            <h3 className="mt-4 font-semibold">{l.label}</h3>
            <p className="mt-2 text-sm text-zinc-400">{l.text}</p>
          </a>
        ))}
      </div>
    </PageShell>
  );
}
