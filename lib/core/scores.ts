// Deterministic 0-100 wellness scores derived from signals + logs. No AI.
// "problem" scores (stress/anxiety/burnout): higher = worse.
// "confidence" is a positive metric: higher = better.
import type {
  Baseline,
  JournalEntry,
  ScoreBand,
  ScoredMetric,
  Signal,
  WellnessScores,
} from "@/types/domain";
import { affectNegativity, clamp01 } from "@/lib/core/affect";

const ANTICIPATION_THEMES = [
  "mock_anticipation",
  "rumination",
  "sleep_disruption",
];
const ANXIETY_DISTORTIONS = ["catastrophizing", "mental_filter"];
const PRESSURE_THEMES = ["family_pressure", "financial_burden", "guilt"];

const mean = (xs: number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const share = (xs: boolean[]): number =>
  xs.length ? xs.filter(Boolean).length / xs.length : 0;

interface Aggregates {
  negativity: number;
  sleepDeficitShare: number;
  distortionDensity: number;
  negEfficacyShare: number;
  lowFutureShare: number;
  highFutureShare: number;
  posEfficacyShare: number;
  anticipationShare: number;
  grindShare: number;
  moodNorm: number;
}

function aggregate(
  entries: JournalEntry[],
  signals: Signal[],
  baseline: Baseline,
): Aggregates {
  const sleepFloor = Math.min(6, baseline.typical_sleep_hrs - 1);
  return {
    negativity: mean(signals.map((s) => affectNegativity(s.dominant_affect))),
    sleepDeficitShare: share(entries.map((e) => e.sleep_hrs < sleepFloor)),
    distortionDensity: clamp01(
      mean(signals.map((s) => s.distortions.length)) / 2,
    ),
    negEfficacyShare: share(
      signals.map((s) => s.self_efficacy_tone === "negative"),
    ),
    lowFutureShare: share(signals.map((s) => s.future_orientation === "low")),
    highFutureShare: share(signals.map((s) => s.future_orientation === "high")),
    posEfficacyShare: share(
      signals.map((s) => s.self_efficacy_tone === "positive"),
    ),
    anticipationShare: share(
      signals.map(
        (s) =>
          s.themes.some((t) => ANTICIPATION_THEMES.includes(t)) ||
          s.distortions.some((d) => ANXIETY_DISTORTIONS.includes(d)),
      ),
    ),
    grindShare: share(
      entries.map(
        (e, i) =>
          e.study_hrs > baseline.typical_study_hrs &&
          (signals[i].self_efficacy_tone === "negative" ||
            affectNegativity(signals[i].dominant_affect) >= 0.6),
      ),
    ),
    moodNorm: clamp01((mean(entries.map((e) => e.mood)) - 1) / 9),
  };
}

const combine = (parts: Array<[number, number]>): number =>
  clamp01(parts.reduce((sum, [w, v]) => sum + w * v, 0));

// Gamma < 1 pushes genuinely-elevated weeks into the high band without
// inflating calm weeks (0 stays ~0).
const shape = (raw: number, gamma = 0.6): number =>
  Math.round(100 * Math.pow(clamp01(raw), gamma));

function band(value: number, direction: "problem" | "positive"): ScoreBand {
  if (direction === "positive") {
    if (value >= 65) return "high";
    if (value >= 40) return "moderate";
    return "low";
  }
  if (value >= 80) return "severe";
  if (value >= 60) return "high";
  if (value >= 35) return "moderate";
  return "low";
}

const metric = (
  value: number,
  direction: "problem" | "positive",
  evidence: string,
): ScoredMetric => ({
  value,
  band: band(value, direction),
  direction,
  evidence,
});

export function computeScores(
  entries: JournalEntry[],
  signals: Signal[],
  baseline: Baseline,
): WellnessScores {
  const a = aggregate(entries, signals, baseline);

  const stress = shape(
    combine([
      [0.4, a.negativity],
      [0.25, a.sleepDeficitShare],
      [0.2, a.distortionDensity],
      [0.15, a.negEfficacyShare],
    ]),
  );
  const anxiety = shape(
    combine([
      [0.4, a.negativity],
      [0.35, a.anticipationShare],
      [0.25, a.distortionDensity],
    ]),
  );
  const burnout = shape(
    combine([
      [0.3, a.sleepDeficitShare],
      [0.25, a.grindShare],
      [0.25, a.negEfficacyShare],
      [0.2, a.lowFutureShare],
    ]),
  );
  // Confidence is symmetric (no gamma) — it reads the positive signals directly.
  const confidence = Math.round(
    100 *
      combine([
        [0.4, a.posEfficacyShare],
        [0.3, a.highFutureShare],
        [0.3, a.moodNorm],
      ]),
  );

  return {
    stress: metric(
      stress,
      "problem",
      `negative affect on ${Math.round(a.negativity * 100)}% of the week, ${Math.round(a.sleepDeficitShare * 100)}% of nights under target sleep.`,
    ),
    anxiety: metric(
      anxiety,
      "problem",
      `anticipatory / ruminative signals on ${Math.round(a.anticipationShare * 100)}% of entries.`,
    ),
    burnout: metric(
      burnout,
      "problem",
      `${Math.round(a.grindShare * 100)}% of days show over-study while depleted; ${Math.round(a.lowFutureShare * 100)}% low future-orientation.`,
    ),
    confidence: metric(
      confidence,
      "positive",
      `positive self-efficacy on ${Math.round(a.posEfficacyShare * 100)}% of entries; mean mood ${(a.moodNorm * 9 + 1).toFixed(1)}/10.`,
    ),
  };
}
