import { NextResponse } from "next/server";
import { z } from "zod";
import type { AssessmentResult } from "@/types/domain";
import { runPipeline } from "@/lib/core/pipeline";
import { buildSafetyView } from "@/lib/core/safety";
import { loadDataset } from "@/lib/data/loadDataset";
import { fallbackInsight, fallbackIntervention } from "@/lib/data/fallbacks";
import { synthesizeInsight, personalize } from "@/lib/ai";
import { rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs"; // Gemini SDK needs the Node runtime, not Edge.

// The API accepts ONLY a dataset selector — never arbitrary journal text — which
// keeps untrusted input out of the model entirely on this path.
const BodyZ = z.object({ datasetId: z.enum(["before", "after"]).default("before") });

export async function POST(req: Request) {
  // Cap request volume to protect live token spend / prevent abuse.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limit = rateLimit(`analyze:${ip}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = BodyZ.safeParse(await req.json().catch(() => ({})));
  const datasetId = parsed.success ? parsed.data.datasetId : "before";

  const dataset = loadDataset(datasetId);
  const core = runPipeline(datasetId, dataset);

  // Deterministic result is complete already; AI only enriches wording.
  const [liveInsight, livePersonalized] = await Promise.all([
    synthesizeInsight(core),
    personalize(core),
  ]);

  const insight = liveInsight ?? fallbackInsight(datasetId);
  const personalizedIntervention =
    livePersonalized ?? fallbackIntervention(datasetId);

  const result: AssessmentResult = {
    ...core,
    insight,
    personalizedIntervention,
    safety: buildSafetyView(core.crisis),
    sources: {
      insight: liveInsight ? "live" : "fallback",
      personalize: livePersonalized ? "live" : "fallback",
    },
  };

  return NextResponse.json(result);
}
