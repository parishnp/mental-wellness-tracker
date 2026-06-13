import { describe, it, expect } from "vitest";
import {
  runPipeline,
  resolveSignals,
  buildInsightInput,
} from "@/lib/core/pipeline";
import { loadDataset } from "@/lib/data/loadDataset";
import type { JournalEntry, Signal } from "@/types/domain";

describe("runPipeline — before (Aarav, the hidden Sunday pattern)", () => {
  const core = runPipeline("before", loadDataset("before"));

  it("identifies Sunday as the worst recurring weekday", () => {
    expect(core.findings.worstDay).toBe("Sunday");
  });

  it("reproduces the proven mood split (5.7 vs 6.4)", () => {
    expect(core.findings.worstDayAvgMood).toBe(5.7);
    expect(core.findings.nonWorstDayAvgMood).toBe(6.4);
  });

  it("finds exactly the three mock-Sundays as the said-fine/wrote-distressed pattern", () => {
    expect(core.patternDates).toEqual([
      "2026-06-01",
      "2026-06-08",
      "2026-06-15",
    ]);
  });

  it("selects the rule-chosen post-mock Sunday reset", () => {
    expect(core.selectedIntervention.id).toBe("post_mock_sunday_reset");
  });

  it("escalates crisis on the Friday risk entry", () => {
    expect(core.crisis.level).toBe("elevated");
    expect(core.crisis.triggeredByDate).toBe("2026-06-13");
  });

  it("scores read elevated stress/anxiety and depressed confidence", () => {
    expect(core.scores.stress.value).toBeGreaterThanOrEqual(55);
    expect(core.scores.anxiety.value).toBeGreaterThanOrEqual(50);
    expect(core.scores.confidence.value).toBeLessThan(60);
  });
});

describe("runPipeline — after (recovery)", () => {
  const core = runPipeline("after", loadDataset("after"));

  it("no longer flags a recurring dip", () => {
    expect(core.patternDates).toHaveLength(0);
  });

  it("clears the crisis state", () => {
    expect(core.crisis.level).toBe("none");
    expect(core.crisis.triggeredByDate).toBeNull();
  });

  it("scores flip: low stress, high confidence", () => {
    expect(core.scores.stress.value).toBeLessThanOrEqual(30);
    expect(core.scores.confidence.value).toBeGreaterThanOrEqual(70);
  });
});

describe("resolveSignals / buildInsightInput", () => {
  const entry: JournalEntry = {
    date: "2026-01-01",
    weekday: "Monday",
    mood: 6,
    sleep_hrs: 7,
    study_hrs: 8,
    text: "two words",
  };

  it("prefers an override signal when provided", () => {
    const override: Signal = {
      dominant_affect: "frustration",
      themes: ["x"],
      distortions: [],
      future_orientation: "low",
      self_efficacy_tone: "negative",
      entry_length_words: 99,
      risk_flag: false,
    };
    expect(resolveSignals([entry], [override])[0]).toBe(override);
  });

  it("falls back to a neutral default when an entry has no embedded signal", () => {
    const s = resolveSignals([entry])[0];
    expect(s.dominant_affect).toBe("neutral");
    expect(s.entry_length_words).toBe(2);
  });

  it("buildInsightInput exposes only proven findings to the model", () => {
    const core = runPipeline("before", loadDataset("before"));
    const input = buildInsightInput(core);
    expect(input.findings.worstDay).toBe("Sunday");
    expect(input.mismatch.count).toBe(3);
  });
});
