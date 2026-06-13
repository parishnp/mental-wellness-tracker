// Composes the deterministic core into one CoreResult. Pure: no AI, no IO.
import type {
  CoreResult,
  Dataset,
  DatasetId,
  JournalEntry,
  Signal,
} from "@/types/domain";
import { computeFindings, buildTrajectory } from "@/lib/core/stats";
import { evaluateMismatches } from "@/lib/core/mismatch";
import { computeScores } from "@/lib/core/scores";
import { screen } from "@/lib/core/crisis";
import { selectIntervention } from "@/lib/core/selectIntervention";

/** Neutral signal used when neither AI extraction nor an embedded signal is available. */
export function neutralSignal(text: string): Signal {
  return {
    dominant_affect: "neutral",
    themes: [],
    distortions: [],
    future_orientation: "neutral",
    self_efficacy_tone: "neutral",
    entry_length_words: text.trim().split(/\s+/).filter(Boolean).length,
    risk_flag: false,
  };
}

/** Resolve signals for each entry: prefer an override (live AI), else the embedded signal. */
export function resolveSignals(
  entries: JournalEntry[],
  overrides?: (Signal | null)[],
): Signal[] {
  return entries.map((e, i) => {
    const override = overrides?.[i];
    if (override) return override;
    if (e.precomputed_signals) return e.precomputed_signals;
    // Defensive fallback if a dataset entry ever lacks a signal.
    return neutralSignal(e.text);
  });
}

export function runPipeline(
  datasetId: DatasetId,
  dataset: Dataset,
  signalOverrides?: (Signal | null)[],
): CoreResult {
  const { entries, baseline, student } = dataset;
  const signals = resolveSignals(entries, signalOverrides);

  const findings = computeFindings(entries, signals);
  const mismatches = evaluateMismatches(entries, signals);
  const scores = computeScores(entries, signals, baseline);
  const crisis = screen(entries, signals);
  const selectedIntervention = selectIntervention(findings, signals);
  const trajectory = buildTrajectory(entries, signals, findings.worstDay);

  // The recurring cluster the student didn't see: mismatch days that land on the worst weekday.
  const patternDates = mismatches
    .filter((m) => m.mismatch && m.weekday === findings.worstDay)
    .map((m) => m.date);

  return {
    datasetId,
    student,
    baseline,
    entries,
    signals,
    trajectory,
    findings,
    mismatches,
    patternDates,
    scores,
    crisis,
    selectedIntervention,
  };
}

/** The exact, minimal JSON the insight prompt is allowed to verbalize. */
export function buildInsightInput(core: CoreResult) {
  return {
    student: { name: core.student.name, exam: core.student.exam },
    findings: {
      worstDay: core.findings.worstDay,
      worstDayAvgMood: core.findings.worstDayAvgMood,
      nonWorstDayAvgMood: core.findings.nonWorstDayAvgMood,
      sleepMoodLag: core.findings.sleepMoodLag,
      worstDaySleepHrs: core.findings.worstDaySleepHrs,
      entryLengthTrend: core.findings.entryLengthTrend,
      recurringNegativeThemes: core.findings.recurringNegativeThemes,
    },
    mismatch: {
      patternDates: core.patternDates,
      count: core.patternDates.length,
      note: "On these days mood was logged as 'fine' (>=5) but the writing carried negative affect and distortions.",
    },
  };
}
