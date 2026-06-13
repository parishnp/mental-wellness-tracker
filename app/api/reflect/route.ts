import { NextResponse } from "next/server";
import { z } from "zod";
import type { ReflectResponse, JournalEntry } from "@/types/domain";
import { screenText } from "@/lib/core/crisis";
import { buildSafetyView } from "@/lib/core/safety";
import { neutralSignal } from "@/lib/core/pipeline";
import { extractSignals } from "@/lib/ai/extractSignals";
import { rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs"; // Gemini SDK needs the Node runtime, not Edge.

// The student writes their OWN open-ended entry here. Unlike /analyze (which only
// accepts a dataset selector), this is the live-journaling path: untrusted free
// text goes through the deterministic crisis screen FIRST, then GenAI extraction.
const BodyZ = z.object({
  text: z.string().min(1).max(2000),
  mood: z.number().int().min(1).max(10).optional(),
  sleep_hrs: z.number().min(0).max(24).optional(),
  study_hrs: z.number().min(0).max(24).optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limit = rateLimit(`reflect:${ip}`, 20);
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
  const { text, mood, sleep_hrs, study_hrs } = parsed.data;

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
  const safety = elevated
    ? buildSafetyView({
        level: "elevated",
        riskFlag: signal.risk_flag,
        triggeredByDate: null,
        detectedPhrases: hits,
      })
    : null;

  const res: ReflectResponse = { signal, safety, source: live ? "live" : "fallback" };
  return NextResponse.json(res);
}
