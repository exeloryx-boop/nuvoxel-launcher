import { MessageCircle, Send, Video, Globe, Users, Heart, ArrowUpRight, Sparkles } from "lucide-react";
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
      color: "from-indigo-500/20 to-purple-600/10",
      border: "border-indigo-500/30",
      iconColor: "text-indigo-400",
      members: "2,400+",
    },
    {
      icon: Send,
      label: "Telegram",
      href: "https://t.me/",
      text: t("communityTelegram"),
      color: "from-sky-500/20 to-cyan-600/10",
      border: "border-sky-500/30",
      iconColor: "text-sky-400",
      members: "1,800+",
    },
    {
      icon: Globe,
      label: "VK",
      href: "https://vk.com/",
      text: "Спільнота ВКонтакте — новини, гайди та оновлення",
      color: "from-blue-500/20 to-blue-600/10",
      border: "border-blue-500/30",
      iconColor: "text-blue-400",
      members: "950+",
    },
    {
      icon: Video,
      label: "YouTube",
      href: "https://youtube.com/",
      text: t("communityYoutube"),
      color: "from-red-500/20 to-rose-600/10",
      border: "border-red-500/30",
      iconColor: "text-red-400",
      members: "5K+",
    },
  ];

  const stats = [
    { icon: Users, label: "Гравців онлайн", value: "2,500+", accent: "text-emerald-400" },
    { icon: Heart, label: "Спільнота", value: "10K+", accent: "text-pink-400" },
    { icon: Sparkles, label: "Збірок створено", value: "340+", accent: "text-amber-400" },
  ];

  return (
    <PageShell
      label={t("communityLabel")}
      title={t("communityTitle")}
      subtitle="Discord, Telegram, VK і YouTube — оберіть зручний канал"
    >
      {/* Stats Bar */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card flex items-center gap-4 p-5">
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <s.icon className={`h-5 w-5 ${s.accent}`} />
            </div>
            <div>
              <p className={`text-xl font-extrabold tracking-tight ${s.accent}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Community Cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className={`group glass-card relative overflow-hidden p-6 transition-all duration-300 hover:border-white/25 hover:shadow-xl`}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${l.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div className={`rounded-2xl bg-white/5 p-3.5 border ${l.border} ${l.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <l.icon className="h-7 w-7" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-white">{l.label}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{l.text}</p>

              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 font-semibold text-zinc-300">
                  <Users className="h-3 w-3" /> {l.members} учасників
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </PageShell>
  );
}
