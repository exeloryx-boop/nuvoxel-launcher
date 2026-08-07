import { useEffect, useState } from "react";
import { AlertTriangle, Info, Siren, X } from "lucide-react";
import { getSocialApiUrl } from "../../services/nuvoxelApi";

type Broadcast = {
  text: string;
  type: "info" | "warning" | "alert";
  active: boolean;
  updatedAt: number;
};

const DISMISSED_PREFIX = "nuvolexlauncher-dismissed-broadcast:";

export function GlobalAnnouncementBanner() {
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`${getSocialApiUrl()}/broadcast`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json() as Broadcast;
        if (!data.active || !data.text?.trim()) return;
        if (localStorage.getItem(`${DISMISSED_PREFIX}${data.updatedAt}`)) return;
        setBroadcast(data);
      } catch {
        // Announcements are optional and must never block the launcher.
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  if (!broadcast || dismissed) return null;
  const appearance = broadcast.type === "alert"
    ? { icon: Siren, classes: "border-red-500/40 bg-red-500/10 text-red-100", iconClasses: "text-red-300" }
    : broadcast.type === "warning"
      ? { icon: AlertTriangle, classes: "border-amber-500/40 bg-amber-500/10 text-amber-100", iconClasses: "text-amber-300" }
      : { icon: Info, classes: "border-sky-500/40 bg-sky-500/10 text-sky-100", iconClasses: "text-sky-300" };
  const Icon = appearance.icon;

  const close = () => {
    localStorage.setItem(`${DISMISSED_PREFIX}${broadcast.updatedAt}`, "1");
    setDismissed(true);
  };

  return (
    <div className={`mb-4 flex shrink-0 items-start gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-md ${appearance.classes}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${appearance.iconClasses}`} />
      <p className="min-w-0 flex-1 font-medium leading-relaxed">{broadcast.text}</p>
      <button type="button" onClick={close} className="rounded p-0.5 opacity-70 transition hover:bg-white/10 hover:opacity-100" title="Закрити">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
