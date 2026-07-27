import { useMemo, useState } from "react";
import { t } from "../../i18n";
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from "../../data/achievements";
import type { AchievementCategory } from "../../types/achievements";
import { useAppStore } from "../../store/useAppStore";

function formatUnlockDate(ts: number, locale: string): string {
  return new Date(ts).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AchievementsPanel() {
  const [filter, setFilter] = useState<AchievementCategory>("all");
  const unlocked = useAppStore((s) => s.unlockedAchievements);
  const nuvoxelSession = useAppStore((s) => s.nuvoxelSession);
  const language = useAppStore((s) => s.language);

  const locale =
    language === "uk" ? "uk-UA" : language === "en" ? "en-US" : "ru-RU";

  const filtered = useMemo(
    () =>
      filter === "all"
        ? ACHIEVEMENTS
        : ACHIEVEMENTS.filter((a) => a.category === filter),
    [filter],
  );

  const unlockedCount = Object.keys(unlocked).length;

  return (
    <div className="mt-6">
      {!nuvoxelSession && (
        <p className="mb-4 text-sm text-text-muted">{t("achievementsLoginHint")}</p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {ACHIEVEMENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`no-drag rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === cat
                ? "bg-[var(--accent)] text-white"
                : "border border-border bg-bg-card text-text-secondary hover:border-white/20"
            }`}
          >
            {t(`achCat_${cat}` as never)}
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs text-text-muted">
        {t("achievementsProgress", {
          done: String(unlockedCount),
          total: String(ACHIEVEMENTS.length),
        })}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map((ach) => {
          const unlockTs = unlocked[ach.id];
          const done = Boolean(unlockTs);
          return (
            <div
              key={ach.id}
              className={`flex gap-3 rounded-xl border p-3 transition ${
                done
                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                  : "border-border bg-bg-card opacity-90"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
                  done ? "bg-[var(--accent)]/15" : "bg-bg-elevated grayscale"
                }`}
              >
                {ach.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t(ach.titleKey as never)}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                  {t(ach.descKey as never)}
                </p>
                <p
                  className={`mt-2 text-[10px] font-medium uppercase tracking-wide ${
                    done ? "text-[var(--accent)]" : "text-text-muted"
                  }`}
                >
                  {done
                    ? t("achievementUnlocked", {
                        date: formatUnlockDate(unlockTs, locale),
                      })
                    : t("achievementLocked")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
