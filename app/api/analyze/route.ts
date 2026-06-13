import { NextResponse } from "next/server";
import { z } from "zod";
import type { AiSource, AnalyzeResponse, DatasetId } from "@/types/domain";
import { runPipeline } from "@/lib/core/pipeline";
import { buildSafetyView } from "@/lib/core/safety";
import { loadDataset } from "@/lib/data/loadDataset";
import { fallbackInsight, fallbackIntervention } from "@/lib/data/fallbacks";
import { synthesizeInsight, personalize } from "@/lib/ai";
import { rateLimited } from "@/lib/api/http";
import { RATE_LIMITS } from "@/lib/config/limits";
import { omit } from "@/lib/utils";

export const runtime = "nodejs"; // Gemini SDK needs the Node runtime, not Edge.

// The API accepts ONLY a dataset selector — never arbitrary journal text — which
// keeps untrusted input out of the model entirely on this path. A malformed body
// deliberately defaults to "before" rather than erroring.
const BodyZ = z.object({
  datasetId: z.enum(["before", "after"]).default("before"),
});

interface AiBlock {
  insight: string;
  personalizedIntervention: string;
  sources: { insight: AiSource; personalize: AiSource };
}
// Per-dataset memo of the AI wording so re-analyze / toggle-back never re-calls Gemini.
const aiCache = new Map<DatasetId, AiBlock>();

async function resolveAi(
  datasetId: DatasetId,
  core: Parameters<typeof synthesizeInsight>[0],
): Promise<AiBlock> {
  const cached = aiCache.get(datasetId);
  if (cached) return cached;
  // Deterministic result is complete already; AI only enriches wording.
  const [liveInsight, livePersonalized] = await Promise.all([
    synthesizeInsight(core),
    personalize(core),
  ]);
  const block: AiBlock = {
    insight: liveInsight ?? fallbackInsight(datasetId),
    personalizedIntervention:
      livePersonalized ?? fallbackIntervention(datasetId),
    sources: {
      insight: liveInsight ? "live" : "fallback",
      personalize: livePersonalized ? "live" : "fallback",
    },
  };
  aiCache.set(datasetId, block);
  return block;
}

export async function POST(req: Request) {
  const limited = rateLimited(req, "analyze", RATE_LIMITS.analyze);
  if (limited) return limited;

  const parsed = BodyZ.safeParse(await req.json().catch(() => ({})));
  const datasetId = parsed.success ? parsed.data.datasetId : "before";

  const core = runPipeline(datasetId, loadDataset(datasetId));
  const ai = await resolveAi(datasetId, core);

  // Trim the heavy, client-unused fields from the wire payload.
  const result: AnalyzeResponse = {
    ...omit(core, ["mismatches", "signals"]),
    ...ai,
    safety: buildSafetyView(core.crisis),
  };
  return NextResponse.json(result);
}
