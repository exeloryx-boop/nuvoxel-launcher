import { Link } from "react-router-dom";
import { Heart, History, Wifi, Users, Zap, Copy, Check, Signal } from "lucide-react";
import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";
import { useState } from "react";

export function ServersPage() {
  const { t, localeTag } = useWebI18n();
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const servers = [
    {
      name: "Nuvoxel SkyBlock",
      ip: "play.nuvoxel.net",
      online: 1240,
      maxPlayers: 2000,
      tag: "SkyBlock",
      version: "1.21.4",
      gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
      tagColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      dotColor: "bg-emerald-400",
    },
    {
      name: "Nuvoxel RPG",
      ip: "rpg.nuvoxel.net",
      online: 890,
      maxPlayers: 1500,
      tag: "RPG",
      version: "1.21.4",
      gradient: "from-purple-500/20 via-violet-500/10 to-transparent",
      tagColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      dotColor: "bg-purple-400",
    },
    {
      name: "Nuvoxel Survival",
      ip: "survival.nuvoxel.net",
      online: 456,
      maxPlayers: 800,
      tag: "Survival",
      version: "1.21.4",
      gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
      tagColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      dotColor: "bg-amber-400",
    },
  ];

  const copyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <PageShell
      label={t("serversLabel")}
      title={t("serversTitle")}
      subtitle={t("serversSubtitle")}
    >
      {/* Server Cards */}
      <div className="grid gap-5">
        {servers.map((s, i) => {
          const percentage = Math.round((s.online / s.maxPlayers) * 100);
          return (
            <div
              key={s.name}
              className="glass-card group relative overflow-hidden p-6 animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-5 min-w-0">
                  {/* Status indicator */}
                  <div className="relative flex-shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                      <Signal className="h-6 w-6 text-[var(--studio-mint)]" />
                    </div>
                    <span className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full ${s.dotColor} border-2 border-[#0a0e0e]`}>
                      <span className={`absolute inset-0 rounded-full ${s.dotColor} animate-ping opacity-75`} />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-bold text-white tracking-tight">{s.name}</h3>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${s.tagColor}`}>
                        {s.tag}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                        {s.version}
                      </span>
                    </div>

                    {/* IP + copy */}
                    <div className="mt-2 flex items-center gap-2">
                      <code className="text-sm text-zinc-400 font-mono">{s.ip}</code>
                      <button
                        onClick={() => copyIp(s.ip)}
                        className="btn-micro rounded-md p-1 text-zinc-500 hover:text-white hover:bg-white/10 transition"
                        title="Скопіювати IP"
                      >
                        {copiedIp === s.ip ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Player bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 w-32 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--studio-mint)] to-[var(--studio-cyan)] transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-zinc-400">
                        <span className="text-white">{s.online.toLocaleString(localeTag)}</span> / {s.maxPlayers.toLocaleString(localeTag)}
                      </span>
                    </div>
                  </div>
                </div>

                <button className="btn-primary px-6 py-3 text-sm font-bold group-hover:shadow-xl group-hover:shadow-[var(--studio-mint)]/20 transition-shadow">
                  <Zap className="h-4 w-4" />
                  {t("homeJoinServer")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Pills */}
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {[
          { icon: Heart, text: t("serversFeat1"), accent: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
          { icon: Wifi, text: t("serversFeat2"), accent: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
          { icon: History, text: t("serversFeat3"), accent: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
        ].map((f) => (
          <div key={f.text} className="glass-card flex items-center gap-4 p-5">
            <div className={`rounded-xl ${f.bg} border p-3`}>
              <f.icon className={`h-5 w-5 ${f.accent}`} />
            </div>
            <span className="text-sm text-zinc-300 font-medium">{f.text}</span>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link to="/download" className="btn-primary inline-flex">
          {t("downloadLauncher")}
        </Link>
        <Link to="/community" className="btn-outline inline-flex">
          <Users className="h-4 w-4" /> Спільнота
        </Link>
      </div>
    </PageShell>
  );
}
