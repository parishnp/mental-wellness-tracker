import { describe, it, expect } from "vitest";
import { fallbackReply } from "@/lib/data/chatFallback";
import { runPipeline } from "@/lib/core/pipeline";
import { loadDataset } from "@/lib/data/loadDataset";

const core = runPipeline("before", loadDataset("before"));

describe("offline chat fallback (pattern-aware, deterministic)", () => {
  it("routes a sleep message to the sleep-focused reply", () => {
    const r = fallbackReply(
      core,
      "I keep staying up too late and I'm exhausted",
    );
    expect(r.toLowerCase()).toMatch(/sleep|night|seven hours/);
  });

  it("routes a mock/score message to the results-cap reply", () => {
    const r = fallbackReply(core, "my mock score dropped again");
    expect(r.toLowerCase()).toMatch(/mock|data point|review/);
  });

  it("grounds the default reply in the student and the selected routine", () => {
    const r = fallbackReply(core, "I don't even know where to start");
    expect(r).toContain(core.student.name);
    expect(r).toContain(core.selectedIntervention.title);
  });
});
