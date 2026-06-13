import { describe, it, expect } from "vitest";
import { selectIntervention } from "@/lib/core/selectIntervention";
import type { Signal, StatsFindings } from "@/types/domain";

const findings = (over: Partial<StatsFindings> = {}): StatsFindings => ({
  worstDay: "Sunday",
  worstDayAvgMood: 5.7,
  nonWorstDayAvgMood: 6.4,
  clusters: [],
  sleepMoodLag: "",
  strongerLag: "none",
  entryLengthTrend: "flat",
  moodTrend: "flat",
  recurringNegativeThemes: [],
  worstDaySleepHrs: [],
  ...over,
});

const sig = (over: Partial<Signal> = {}): Signal => ({
  dominant_affect: "calm",
  themes: [],
  distortions: [],
  future_orientation: "neutral",
  self_efficacy_tone: "neutral",
  entry_length_words: 10,
  risk_flag: false,
  ...over,
});

describe("selectIntervention (rule-based, deterministic)", () => {
  it("mock-cluster + sleep lag → post-mock Sunday reset", () => {
    const r = selectIntervention(findings({ strongerLag: "same-night" }), [
      sig({ themes: ["mock_results", "self_comparison"] }),
    ]);
    expect(r.id).toBe("post_mock_sunday_reset");
  });

  it("sleep lag without mock themes → sleep stabilization", () => {
    const r = selectIntervention(findings({ strongerLag: "next-day" }), [
      sig(),
    ]);
    expect(r.id).toBe("sleep_stabilization");
  });

  it("distortions present (no lag) → thought reframe", () => {
    const r = selectIntervention(findings(), [
      sig({ distortions: ["all_or_nothing"] }),
    ]);
    expect(r.id).toBe("thought_reframe");
  });

  it("negative self-efficacy only → wins log", () => {
    const r = selectIntervention(findings(), [
      sig({ self_efficacy_tone: "negative" }),
    ]);
    expect(r.id).toBe("wins_log");
  });

  it("family/financial pressure → autonomy reframe", () => {
    const r = selectIntervention(findings(), [
      sig({ themes: ["family_pressure"] }),
    ]);
    expect(r.id).toBe("autonomy_reframe");
  });
});
