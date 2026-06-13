import { describe, it, expect } from "vitest";
import { affectNegativity, isNegativeAffect } from "@/lib/core/affect";
import { evaluateMismatches } from "@/lib/core/mismatch";
import { computeScores } from "@/lib/core/scores";
import type { Baseline, JournalEntry, Signal } from "@/types/domain";

const baseline: Baseline = {
  typical_mood: 6.5,
  typical_sleep_hrs: 6.5,
  typical_study_hrs: 9,
};

describe("affect polarity", () => {
  it("maps positive and negative affects to the right end of the scale", () => {
    expect(affectNegativity("calm")).toBe(0);
    expect(affectNegativity("frustration")).toBe(1);
    expect(isNegativeAffect("hopelessness")).toBe(true);
    expect(isNegativeAffect("content")).toBe(false);
  });
});

describe("mismatch detection (said fine, wrote distressed)", () => {
  it("flags mood>=5 with negative self-efficacy", () => {
    const entries: JournalEntry[] = [
      { date: "d", weekday: "Sunday", mood: 6, sleep_hrs: 4, study_hrs: 11, text: "it's fine" },
    ];
    const signals: Signal[] = [
      {
        dominant_affect: "frustration",
        themes: ["mock_results"],
        distortions: ["all_or_nothing"],
        future_orientation: "low",
        self_efficacy_tone: "negative",
        entry_length_words: 20,
        risk_flag: false,
      },
    ];
    expect(evaluateMismatches(entries, signals)[0].mismatch).toBe(true);
  });
});

describe("wellness scores respond to signal content", () => {
  const mk = (affect: string, tone: Signal["self_efficacy_tone"], future: Signal["future_orientation"]): Signal => ({
    dominant_affect: affect,
    themes: [],
    distortions: [],
    future_orientation: future,
    self_efficacy_tone: tone,
    entry_length_words: 30,
    risk_flag: false,
  });

  it("a calm, confident week scores low stress and high confidence", () => {
    const entries: JournalEntry[] = Array.from({ length: 4 }, (_, i) => ({
      date: `d${i}`,
      weekday: "Monday",
      mood: 8,
      sleep_hrs: 7,
      study_hrs: 8,
      text: "good day",
    }));
    const signals = entries.map(() => mk("content", "positive", "high"));
    const s = computeScores(entries, signals, baseline);
    expect(s.stress.value).toBeLessThan(25);
    expect(s.confidence.value).toBeGreaterThan(70);
  });

  it("a depleted, negative week scores high stress and low confidence", () => {
    const entries: JournalEntry[] = Array.from({ length: 4 }, (_, i) => ({
      date: `d${i}`,
      weekday: "Sunday",
      mood: 5,
      sleep_hrs: 4,
      study_hrs: 12,
      text: "useless",
    }));
    const signals = entries.map(() => mk("frustration", "negative", "low"));
    const s = computeScores(entries, signals, baseline);
    expect(s.stress.value).toBeGreaterThan(55);
    expect(s.confidence.value).toBeLessThan(30);
  });
});
