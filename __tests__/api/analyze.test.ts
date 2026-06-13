import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/analyze/route";

const post = (body: unknown) =>
  POST(
    new Request("http://test/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "2.2.2.2",
      },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/analyze", () => {
  it("runs the pipeline and returns insight, scores, and the seed crisis escalation", async () => {
    const res = await post({ datasetId: "before" });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.findings.worstDay).toBe("Sunday");
    expect(json.scores.stress.value).toBeGreaterThan(0);
    // The "before" seed contains a risk entry → safety must be elevated.
    expect(json.safety.level).toBe("elevated");
    // Offline (no key) → fallback wording, never empty.
    expect(json.insight.length).toBeGreaterThan(0);
    expect(json.sources.insight).toBe("fallback");
  });

  it("memoizes AI wording so a repeat call returns identical output", async () => {
    const a = await (await post({ datasetId: "after" })).json();
    const b = await (await post({ datasetId: "after" })).json();
    expect(b.insight).toBe(a.insight);
    expect(b.safety.level).toBe("none");
  });

  it("defaults to the 'before' dataset on a malformed body", async () => {
    const res = await post("not-an-object");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.datasetId).toBe("before");
  });
});
