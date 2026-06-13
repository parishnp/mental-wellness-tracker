import { describe, it, expect } from "vitest";
import { buildSafetyView, HELPLINE } from "@/lib/core/safety";

describe("buildSafetyView", () => {
  it("surfaces the helpline when crisis is elevated", () => {
    const v = buildSafetyView({
      level: "elevated",
      riskFlag: true,
      triggeredByDate: "2026-06-13",
      detectedPhrases: ["burden"],
    });
    expect(v.level).toBe("elevated");
    expect(v.triggeredByDate).toBe("2026-06-13");
    expect(v.resources).toEqual(HELPLINE);
    expect(v.resources?.primary).toMatch(/14416/);
  });

  it("returns no resources when there is no risk", () => {
    const v = buildSafetyView({
      level: "none",
      riskFlag: false,
      triggeredByDate: null,
      detectedPhrases: [],
    });
    expect(v.level).toBe("none");
    expect(v.resources).toBeNull();
  });
});
