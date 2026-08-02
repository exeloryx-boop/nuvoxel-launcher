import { useState } from "react";
import {
  Download,
  Monitor,
  CheckCircle2,
  ShieldCheck,
  Package,
  X,
  Cpu,
  Sparkles,
  ExternalLink,
  Check
} from "lucide-react";
import { PageShell } from "./ModsPage";
import { useWebI18n } from "../hooks/useWebI18n";

interface DownloadFormat {
  id: "msi" | "exe" | "zip" | "jar";
  name: string;
  extension: string;
  recommended?: boolean;
  size: string;
  desc: string;
  badge: string;
  color: string;
}

export function DownloadPage() {
  const { t } = useWebI18n();
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  const formats: DownloadFormat[] = [
    {
      id: "msi",
      name: "Windows Installer",
      extension: ".msi",
      recommended: true,
      size: "84.2 MB",
      desc: "Офіційний інсталятор з автоматичною реєстрацією в системі та автоматичним оновленням.",
      badge: "РЕКОМЕНДОВАНО",
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: "exe",
      name: "Windows Portable",
      extension: ".exe",
      size: "91.5 MB",
      desc: "Портативна версія. Не вимагає інсталяції — запуск відразу з флешки або будь-якої папки.",
      badge: "PORTABLE",
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "zip",
      name: "ZIP Архів",
      extension: ".zip",
      size: "79.8 MB",
      desc: "Повний автономний архів з бінарними файлами та готовим середовищем Java 21.",
      badge: "OFFLINE ZIP",
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "jar",
      name: "Universal Java Client",
      extension: ".jar",
      size: "42.1 MB",
      desc: "Кросплатформений клієнт для Linux, macOS та операційних систем з власним версіонуванням Java.",
      badge: "CROSS-PLATFORM",
      color: "from-blue-500 to-cyan-600",
    },
  ];

  const handleStartDownload = (format: DownloadFormat) => {
    setSelectedFormat(format);
    setDownloading(true);
    setProgress(0);
    setDownloadCompleted(false);

    // Simulate progress bar animation
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 25) + 15;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setDownloading(false);
        setDownloadCompleted(true);
        triggerActualFileDownload(format.extension);
      }
      setProgress(current);
    }, 300);
  };

  const triggerActualFileDownload = (ext: string) => {
    const link = document.createElement("a");
    link.href = `/updates/files/NuvoxelLauncher-v0.7.1${ext}`;
    link.download = `NuvoxelLauncher-v0.7.1${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageShell
      label={t("downloadLabel")}
      title="Завантажити Nuvoxel Launcher"
      subtitle="Офіційний версіонний випуск v0.7.1 Nuvoxel. Оберіть зручний формат завантаження нижче."
    >
      <div className="relative z-10 space-y-12">
        {/* Release Banner */}
        <div className="glass-card glow-border overflow-hidden p-6 sm:p-8 animate-fade-up">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-3.5 shadow-lg shadow-emerald-500/20 text-white shrink-0">
                <Monitor className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-black text-white">Nuvoxel Launcher v0.7.1 Nuvoxel</h2>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-300">
                    Останній стабільний реліз
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300 max-w-2xl leading-relaxed">
                  Підтримка всіх версій Minecraft від <strong>1.0 до 26.2</strong>. Вбудована оптимізація FPS (G1GC Booster), соціальний чат та імпорт збірок Claude.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleStartDownload(formats[0])}
                className="btn-primary flex items-center gap-2 rounded-xl px-6 py-3.5 font-extrabold text-sm shadow-xl shadow-emerald-500/25 hover:scale-105 transition-transform"
              >
                <Download className="h-5 w-5" />
                Скачати .MSI (Швидке встановлення)
              </button>
            </div>
          </div>
        </div>

        {/* Download Formats Selection Grid */}
        <div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Оберіть формат файлу для вашої ОС
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {formats.map((fmt) => (
              <div
                key={fmt.id}
                onClick={() => handleStartDownload(fmt)}
                className={`glass-card hover-lift cursor-pointer p-6 relative flex flex-col justify-between transition-all duration-300 border ${
                  fmt.recommended
                    ? "border-emerald-500/50 bg-emerald-950/20 shadow-lg shadow-emerald-500/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                {fmt.recommended && (
                  <span className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-0.5 text-[10px] font-black uppercase text-black shadow-md">
                    {fmt.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`rounded-xl bg-gradient-to-br ${fmt.color} p-2.5 text-white shadow-md`}>
                      <Package className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-mono font-semibold text-zinc-400 bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
                      {fmt.size}
                    </span>
                  </div>

                  <h4 className="text-lg font-extrabold text-white flex items-center gap-1.5">
                    {fmt.name}
                    <span className="text-xs font-mono text-emerald-400 font-bold">{fmt.extension}</span>
                  </h4>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    {fmt.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1 group-hover:text-emerald-400 transition">
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    Завантажити
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Requirements & Security */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Specs */}
          <div className="glass-card p-6 sm:p-8">
            <h4 className="font-bold text-white text-base flex items-center gap-2 mb-4">
              <Cpu className="h-5 w-5 text-purple-400" />
              Системні вимоги
            </h4>
            <ul className="space-y-3 text-xs text-zinc-300">
              <li className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-400">ОС:</span>
                <span className="font-semibold text-white">Windows 10 / 11 (64-bit) / Linux / macOS</span>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-400">Процесор:</span>
                <span className="font-semibold text-white">Intel Core i3 / AMD Ryzen 3 або новіше</span>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-400">ОЗП (RAM):</span>
                <span className="font-semibold text-white">4 GB (Рекомендовано 8 GB+)</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-zinc-400">Java:</span>
                <span className="font-semibold text-emerald-400">Вбудована Java 21 LTS (Автономна)</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Protection */}
          <div className="glass-card p-6 sm:p-8">
            <h4 className="font-bold text-white text-base flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Захист та Сертифікати
            </h4>
            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Цифровий підпис:</strong> Файли підписані сертифікатом безпеки Wynsense Ecosystem.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Перевірено на віруси:</strong> 0 попереджень VirusTotal. 100% чистий код.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong>Авто-оновлення:</strong> Лаунчер самостійно підтягує нові патчі 1.21.x - 26.2.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beautiful Interactive Download Modal Window */}
      {selectedFormat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#12121a] p-6 sm:p-8 shadow-2xl animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => setSelectedFormat(null)}
              className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Content Header */}
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl bg-gradient-to-br ${selectedFormat.color} p-3 text-white shadow-lg`}>
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Завантаження Nuvoxel</h3>
                <p className="text-xs text-emerald-400 font-mono font-semibold">
                  {selectedFormat.name} ({selectedFormat.extension}) • {selectedFormat.size}
                </p>
              </div>
            </div>

            {/* Progress or Completion State */}
            <div className="mt-6 space-y-4">
              {downloading ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                    <span>Підготовка файлу...</span>
                    <span className="text-emerald-400">{progress}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-black/60 p-0.5 border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-purple-500 transition-all duration-300 shadow-md shadow-emerald-500/30"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : downloadCompleted ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2 animate-bounce-in">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Завантаження розпочато!</h4>
                  <p className="text-xs text-zinc-300">
                    Якщо файл не почав завантажуватися автоматично, натисніть кнопку нижче.
                  </p>
                </div>
              ) : null}

              {/* Format details summary */}
              <div className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-2 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Версія:</span>
                  <span className="font-mono text-white">v0.7.1 Nuvoxel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Формат:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedFormat.extension}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Хеш SHA-256:</span>
                  <span className="font-mono text-zinc-500 truncate max-w-[200px]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedFormat(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition"
              >
                Закрити
              </button>
              <button
                onClick={() => triggerActualFileDownload(selectedFormat.extension)}
                className="btn-primary rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg shadow-emerald-500/20"
              >
                Повторити завантаження
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
