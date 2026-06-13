import { describe, it, expect } from "vitest";
import { screen, screenText } from "@/lib/core/crisis";
import type { JournalEntry, Signal } from "@/types/domain";

const baseSignal: Signal = {
  dominant_affect: "calm",
  themes: [],
  distortions: [],
  future_orientation: "neutral",
  self_efficacy_tone: "neutral",
  entry_length_words: 10,
  risk_flag: false,
};

const entry = (text: string): JournalEntry => ({
  date: "2026-01-01",
  weekday: "Monday",
  mood: 6,
  sleep_hrs: 7,
  study_hrs: 8,
  text,
});

describe("crisis screen (deterministic, overrides the model upward)", () => {
  it("escalates on an explicit lexicon phrase", () => {
    const r = screen(
      [entry("some days they'd be better off without me")],
      [baseSignal],
    );
    expect(r.level).toBe("elevated");
    expect(r.triggeredByDate).toBe("2026-01-01");
  });

  it("escalates when a signal carries risk_flag even with benign text", () => {
    const r = screen(
      [entry("nothing notable today")],
      [{ ...baseSignal, risk_flag: true }],
    );
    expect(r.level).toBe("elevated");
  });

  it("stays none for ordinary stressed text", () => {
    const r = screen(
      [entry("frustrated with chemistry but pushing on")],
      [baseSignal],
    );
    expect(r.level).toBe("none");
    expect(r.triggeredByDate).toBeNull();
  });
});

describe("screenText (the chat safety gate)", () => {
  it("detects an explicit crisis phrase in a chat message", () => {
    expect(
      screenText("honestly they'd be better off without me").length,
    ).toBeGreaterThan(0);
  });

  it("returns no hits for an ordinary stressed message", () => {
    expect(screenText("I'm so tired of these mocks")).toEqual([]);
  });
});
