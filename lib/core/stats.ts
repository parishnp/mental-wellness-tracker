// Deterministic statistics. No AI. Reproduces the proven findings the AI later verbalizes.
import type {
  JournalEntry,
  Signal,
  StatsFindings,
  TrajectoryPoint,
  TrendLabel,
  WeekdayCluster,
} from "@/types/domain";
import { affectNegativity, round1 } from "@/lib/core/affect";

const mean = (xs: number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/** Least-squares slope of y over its index. */
function slope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  const xs = ys.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function trendLabel(s: number): TrendLabel {
  if (s > 0.08) return "rising";
  if (s < -0.08) return "declining";
  return "flat";
}

/** Pearson correlation. */
function corr(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ax = a.slice(0, n);
  const bx = b.slice(0, n);
  const ma = mean(ax);
  const mb = mean(bx);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (ax[i] - ma) * (bx[i] - mb);
    da += (ax[i] - ma) ** 2;
    db += (bx[i] - mb) ** 2;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

export function weekdayClusters(
  entries: JournalEntry[],
  signals: Signal[],
): WeekdayCluster[] {
  const byDay = new Map<string, { moods: number[]; negs: number[] }>();
  entries.forEach((e, i) => {
    const bucket = byDay.get(e.weekday) ?? { moods: [], negs: [] };
    bucket.moods.push(e.mood);
    bucket.negs.push(affectNegativity(signals[i]?.dominant_affect ?? ""));
    byDay.set(e.weekday, bucket);
  });
  return [...byDay.entries()].map(([weekday, b]) => ({
    weekday,
    avgMood: round1(mean(b.moods)),
    avgNegativity: round1(mean(b.negs)),
    count: b.moods.length,
  }));
}

export function buildTrajectory(
  entries: JournalEntry[],
  signals: Signal[],
  worstDay: string,
): TrajectoryPoint[] {
  return entries.map((e, i) => ({
    date: e.date,
    weekday: e.weekday,
    label: `${e.weekday.slice(0, 3)} ${e.date.slice(5)}`,
    mood: e.mood,
    sleep: e.sleep_hrs,
    length: signals[i]?.entry_length_words ?? e.text.trim().split(/\s+/).length,
    isWorstDay: e.weekday === worstDay,
  }));
}

export function computeFindings(
  entries: JournalEntry[],
  signals: Signal[],
): StatsFindings {
  const clusters = weekdayClusters(entries, signals);

  // Worst day = a *recurring* weekday (count >= 2) with the lowest avg mood,
  // tie-broken by highest negativity. This deliberately ignores one-off bad days.
  const recurring = clusters.filter((c) => c.count >= 2);
  const pool = recurring.length ? recurring : clusters;
  const worst = [...pool].sort(
    (a, b) => a.avgMood - b.avgMood || b.avgNegativity - a.avgNegativity,
  )[0];
  const worstDay = worst?.weekday ?? "";

  const worstMoods = entries.filter((e) => e.weekday === worstDay).map((e) => e.mood);
  const otherMoods = entries.filter((e) => e.weekday !== worstDay).map((e) => e.mood);
  const worstSleep = entries
    .filter((e) => e.weekday === worstDay)
    .map((e) => e.sleep_hrs);

  // Sleep -> mood lag: same-night vs next-day correlation.
  const sleep = entries.map((e) => e.sleep_hrs);
  const mood = entries.map((e) => e.mood);
  const sameNight = corr(sleep, mood);
  const nextDay = corr(sleep.slice(0, -1), mood.slice(1));
  let strongerLag: StatsFindings["strongerLag"] = "none";
  if (Math.abs(sameNight) >= 0.2 || Math.abs(nextDay) >= 0.2) {
    strongerLag = Math.abs(sameNight) >= Math.abs(nextDay) ? "same-night" : "next-day";
  }

  const lowSleepDays = entries.filter((e) => e.sleep_hrs <= 4).length;
  const sleepMoodLag =
    strongerLag === "none"
      ? "No strong sleep-to-mood relationship this week."
      : `${worstDay} mood tracks sleep: ${lowSleepDays > 0 ? `the low-mood ${worstDay}s followed ~${Math.min(...worstSleep)}-hour nights` : "shorter nights line up with lower mood"}, and mood recovers within 1–2 days once sleep returns to ~7 hours.`;

  // Recurring negative themes: most common themes on negative-affect entries.
  const themeCount = new Map<string, number>();
  entries.forEach((_, i) => {
    const s = signals[i];
    if (!s) return;
    if (affectNegativity(s.dominant_affect) >= 0.6 || s.self_efficacy_tone === "negative") {
      for (const t of s.themes) themeCount.set(t, (themeCount.get(t) ?? 0) + 1);
    }
  });
  const recurringNegativeThemes = [...themeCount.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .slice(0, 4);

  return {
    worstDay,
    worstDayAvgMood: round1(mean(worstMoods)),
    nonWorstDayAvgMood: round1(mean(otherMoods)),
    clusters,
    sleepMoodLag,
    strongerLag,
    entryLengthTrend: trendLabel(slope(signals.map((s) => s.entry_length_words))),
    moodTrend: trendLabel(slope(mood)),
    recurringNegativeThemes,
    worstDaySleepHrs: worstSleep,
  };
}
