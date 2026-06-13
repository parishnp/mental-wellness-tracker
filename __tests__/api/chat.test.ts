import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/chat/route";

// No GEMINI_API_KEY in the test env, so companionReply returns null and the route
// falls back to the deterministic reply — these assertions are AI-independent.
const post = (body: unknown) =>
  POST(
    new Request("http://test/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "1.1.1.1" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/chat", () => {
  it("intercepts a crisis message BEFORE any model call and escalates", async () => {
    const res = await post({
      datasetId: "before",
      message: "honestly they'd be better off without me",
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.safety?.level).toBe("elevated");
    expect(json.safety?.resources?.primary).toMatch(/14416/);
    expect(json.source).toBe("fallback");
  });

  it("returns a grounded fallback reply for an ordinary message", async () => {
    const res = await post({ datasetId: "before", message: "I'm exhausted tonight" });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.safety).toBeNull();
    expect(typeof json.reply).toBe("string");
    expect(json.reply.length).toBeGreaterThan(0);
  });

  it("rejects an invalid body with 400", async () => {
    const res = await post({ datasetId: "before", message: "" });
    expect(res.status).toBe(400);
  });
});
