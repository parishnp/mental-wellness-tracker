import { NextResponse } from "next/server";
import { z } from "zod";
import type { ChatResponse } from "@/types/domain";
import { runPipeline } from "@/lib/core/pipeline";
import { screenText } from "@/lib/core/crisis";
import { buildSafetyView } from "@/lib/core/safety";
import { loadDataset } from "@/lib/data/loadDataset";
import { fallbackReply } from "@/lib/data/chatFallback";
import { companionReply } from "@/lib/ai/chat";
import { rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const BodyZ = z.object({
  datasetId: z.enum(["before", "after"]).default("before"),
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .max(12)
    .optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limit = rateLimit(`chat:${ip}`, 30);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = BodyZ.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { datasetId, message, history = [] } = parsed.data;

  // SAFETY GATE: rules intercept crisis BEFORE any model call. The companion
  // never handles self-harm/hopelessness conversationally — it escalates.
  const hits = screenText(message);
  if (hits.length > 0) {
    const safety = buildSafetyView({
      level: "elevated",
      riskFlag: true,
      triggeredByDate: null,
      detectedPhrases: hits,
    });
    const res: ChatResponse = {
      reply:
        "I'm really glad you told me this, and I don't want you to carry it alone. This is bigger than what I can help with here — please reach out to one of the people below right now. They're there for exactly this.",
      source: "fallback",
      safety,
    };
    return NextResponse.json(res);
  }

  const core = runPipeline(datasetId, loadDataset(datasetId));
  const live = await companionReply(core, message, history);
  const reply = live ?? fallbackReply(core, message);

  const res: ChatResponse = {
    reply,
    source: live ? "live" : "fallback",
    safety: null,
  };
  return NextResponse.json(res);
}
