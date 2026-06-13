import { NextResponse } from "next/server";
import { z } from "zod";
import type { ChatResponse } from "@/types/domain";
import { runPipeline } from "@/lib/core/pipeline";
import { screenText } from "@/lib/core/crisis";
import { escalatedSafetyView, CRISIS_CHAT_REPLY } from "@/lib/core/safety";
import { loadDataset } from "@/lib/data/loadDataset";
import { fallbackReply } from "@/lib/data/chatFallback";
import { companionReply } from "@/lib/ai/chat";
import { rateLimited, readBody } from "@/lib/api/http";
import { RATE_LIMITS, MAX_INPUT } from "@/lib/config/limits";

export const runtime = "nodejs";

const BodyZ = z.object({
  datasetId: z.enum(["before", "after"]).default("before"),
  message: z.string().min(1).max(MAX_INPUT.chatMessage),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(MAX_INPUT.chatMessage * 2),
      }),
    )
    .max(MAX_INPUT.chatHistory)
    .optional(),
});

export async function POST(req: Request) {
  const limited = rateLimited(req, "chat", RATE_LIMITS.chat);
  if (limited) return limited;

  const body = await readBody(req, BodyZ);
  if ("error" in body) return body.error;
  const { datasetId, message, history = [] } = body.data;

  // SAFETY GATE: rules intercept crisis BEFORE any model call. The companion
  // never handles self-harm/hopelessness conversationally — it escalates.
  const hits = screenText(message);
  if (hits.length > 0) {
    const res: ChatResponse = {
      reply: CRISIS_CHAT_REPLY,
      source: "fallback",
      safety: escalatedSafetyView(hits),
    };
    return NextResponse.json(res);
  }

  const core = runPipeline(datasetId, loadDataset(datasetId));
  const live = await companionReply(core, message, history);

  const res: ChatResponse = {
    reply: live ?? fallbackReply(core, message),
    source: live ? "live" : "fallback",
    safety: null,
  };
  return NextResponse.json(res);
}
