export function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatDownloadsFull(n: number): string {
  return n.toLocaleString("ru-RU");
}

/** Formats tracked play time for stat cards (seconds → localized string). */
export function formatPlayTime(
  totalSeconds: number,
  labels: {
    hours: (h: number) => string;
    minutes: (m: number) => string;
    hoursMinutes: (h: number, m: number) => string;
  },
): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0 && m === 0) return labels.minutes(0);
  if (h === 0) return labels.minutes(m);
  if (m === 0) return labels.hours(h);
  return labels.hoursMinutes(h, m);
}
