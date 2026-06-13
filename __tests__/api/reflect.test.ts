import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/reflect/route";

const post = (body: unknown) =>
  POST(
    new Request("http://test/api/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "3.3.3.3" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/reflect (the student's own journaling path)", () => {
  it("screens raw text and forces risk_flag + elevated safety on a crisis phrase", async () => {
    const res = await post({
      text: "I keep thinking they would be better off without me",
      mood: 4,
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.signal.risk_flag).toBe(true);
    expect(json.safety.level).toBe("elevated");
    expect(json.safety.resources.primary).toMatch(/14416/);
  });

  it("returns a neutral, no-crisis signal offline for an ordinary entry", async () => {
    const res = await post({ text: "Solved a tough integrals set today, felt good.", mood: 7 });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.signal.risk_flag).toBe(false);
    expect(json.safety).toBeNull();
    expect(json.source).toBe("fallback"); // no key in test env
    expect(json.signal.entry_length_words).toBeGreaterThan(0);
  });

  it("rejects an empty entry with 400", async () => {
    const res = await post({ text: "" });
    expect(res.status).toBe(400);
  });
});
