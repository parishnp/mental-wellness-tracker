// Zod validators — the runtime guarantee on anything Gemini returns as JSON.
import { z } from "zod";
import type { Signal } from "@/types/domain";

export const SignalZ = z.object({
  dominant_affect: z.string(),
  themes: z.array(z.string()),
  distortions: z.array(z.string()),
  future_orientation: z.enum(["low", "neutral", "high"]),
  self_efficacy_tone: z.enum(["negative", "neutral", "positive"]),
  entry_length_words: z.number(),
  risk_flag: z.boolean(),
});

export function validateSignal(value: unknown): Signal {
  return SignalZ.parse(value);
}
