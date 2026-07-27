import { Link } from "react-router-dom";
import { Heart, History, Wifi } from "lucide-react";
import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

export function ServersPage() {
  const { t, localeTag } = useWebI18n();

  return (
    <PageShell
      label={t("serversLabel")}
      title={t("serversTitle")}
      subtitle={t("serversSubtitle")}
    >
      <div className="grid gap-4">
        {[
          { name: "HiTech RPG", online: 1240, tag: "RPG" },
          { name: "SkyBlock Pro", online: 890, tag: "SkyBlock" },
          { name: "Anarchy MC", online: 456, tag: "Anarchy" },
        ].map((s) => (
          <div
            key={s.name}
            className="glass-card flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div>
              <p className="text-xs text-zinc-500">{s.tag}</p>
              <h3 className="text-lg font-semibold">{s.name}</h3>
              <p className="text-sm text-[var(--nl-green)]">
                {t("serversPlayersOnline", {
                  count: s.online.toLocaleString(localeTag),
                })}
              </p>
            </div>
            <span className="rounded-lg bg-[var(--nl-green)] px-4 py-2 text-sm font-semibold text-white">
              {t("homeJoinServer")}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          { icon: Heart, text: t("serversFeat1") },
          { icon: Wifi, text: t("serversFeat2") },
          { icon: History, text: t("serversFeat3") },
        ].map((f) => (
          <div key={f.text} className="flex items-center gap-3 text-sm text-zinc-400">
            <f.icon className="h-5 w-5 text-[var(--nl-green)]" />
            {f.text}
          </div>
        ))}
      </div>

      <Link to="/download" className="btn-primary mt-10 inline-flex">
        {t("downloadLauncher")}
      </Link>
    </PageShell>
  );
}
