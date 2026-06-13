import { describe, it, expect } from "vitest";
import { computeFindings, weekdayClusters } from "@/lib/core/stats";
import type { JournalEntry, Signal } from "@/types/domain";

const sig = (affect: string, words: number): Signal => ({
  dominant_affect: affect,
  themes: [],
  distortions: [],
  future_orientation: "neutral",
  self_efficacy_tone: "neutral",
  entry_length_words: words,
  risk_flag: false,
});

describe("stats", () => {
  it("clusters by weekday with averages", () => {
    const entries: JournalEntry[] = [
      {
        date: "1",
        weekday: "Mon",
        mood: 6,
        sleep_hrs: 7,
        study_hrs: 8,
        text: "a",
      },
      {
        date: "2",
        weekday: "Mon",
        mood: 8,
        sleep_hrs: 7,
        study_hrs: 8,
        text: "b",
      },
      {
        date: "3",
        weekday: "Tue",
        mood: 5,
        sleep_hrs: 7,
        study_hrs: 8,
        text: "c",
      },
    ];
    const signals = [
      sig("calm", 10),
      sig("content", 12),
      sig("frustration", 8),
    ];
    const clusters = weekdayClusters(entries, signals);
    const mon = clusters.find((c) => c.weekday === "Mon");
    expect(mon?.avgMood).toBe(7);
    expect(mon?.count).toBe(2);
  });

  it("detects a rising mood trend and reports no strong lag when flat", () => {
    const entries: JournalEntry[] = [4, 5, 6, 7].map((m, i) => ({
      date: `d${i}`,
      weekday: ["Mon", "Tue", "Wed", "Thu"][i],
      mood: m,
      sleep_hrs: 7,
      study_hrs: 8,
      text: "x",
    }));
    const signals = entries.map((_, i) => sig("calm", 20 + i));
    const f = computeFindings(entries, signals);
    expect(f.moodTrend).toBe("rising");
    expect(f.entryLengthTrend).toBe("rising");
    // No weekday repeats → worst-day pool falls back to all clusters.
    expect(f.worstDay).toBe("Mon");
  });
});
