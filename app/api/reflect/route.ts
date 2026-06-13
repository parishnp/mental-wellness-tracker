import { NextResponse } from "next/server";
import { z } from "zod";
import type { ReflectResponse, JournalEntry } from "@/types/domain";
import { screenText } from "@/lib/core/crisis";
import { escalatedSafetyView } from "@/lib/core/safety";
import { neutralSignal } from "@/lib/core/pipeline";
import { extractSignals } from "@/lib/ai/extractSignals";
import { rateLimited, readBody } from "@/lib/api/http";
import { RATE_LIMITS, MAX_INPUT } from "@/lib/config/limits";

export const runtime = "nodejs"; // Gemini SDK needs the Node runtime, not Edge.

// The student writes their OWN open-ended entry here. Unlike /analyze (which only
// accepts a dataset selector), this is the live-journaling path: untrusted free
// text goes through the deterministic crisis screen FIRST, then GenAI extraction.
const BodyZ = z.object({
  text: z.string().min(1).max(MAX_INPUT.journalText),
  mood: z.number().int().min(1).max(10).optional(),
  sleep_hrs: z.number().min(0).max(24).optional(),
  study_hrs: z.number().min(0).max(24).optional(),
});

export async function POST(req: Request) {
  const limited = rateLimited(req, "reflect", RATE_LIMITS.reflect);
  if (limited) return limited;

  const body = await readBody(req, BodyZ);
  if ("error" in body) return body.error;
  const { text, mood, sleep_hrs, study_hrs } = body.data;

  // SAFETY FIRST: the deterministic lexicon screens the raw text before anything
  // else. A hit forces an elevated safety view that the model can never suppress.
  const hits = screenText(text);

  const entry: JournalEntry = {
    date: "",
    weekday: "",
    mood: mood ?? 5,
    sleep_hrs: sleep_hrs ?? 0,
    study_hrs: study_hrs ?? 0,
    text,
  };

  // Live GenAI signal extraction; null (no key / failure) → neutral fallback so
  // the journaling path still works fully offline.
  const [extracted] = await extractSignals([entry]);
  const live = extracted !== null;
  let signal = extracted ?? neutralSignal(text);
  // Rules override the model UPWARD on safety: a lexicon hit forces risk_flag.
  if (hits.length > 0) signal = { ...signal, risk_flag: true };

  const elevated = hits.length > 0 || signal.risk_flag;
  const res: ReflectResponse = {
    signal,
    safety: elevated ? escalatedSafetyView(hits, signal.risk_flag) : null,
    source: live ? "live" : "fallback",
  };
  return NextResponse.json(res);
}
