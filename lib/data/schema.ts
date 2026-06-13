// Runtime validation for seed datasets at the import boundary — removes unsafe
// casts and fails loudly if a data file drifts from the contract.
import { z } from "zod";
import type { Dataset } from "@/types/domain";

/** Canonical schema for a signal object — the single source of truth, reused by
 *  the AI-output validator (lib/ai/schemas.ts) and dataset validation below. */
export const SignalZ = z.object({
  dominant_affect: z.string(),
  themes: z.array(z.string()),
  distortions: z.array(z.string()),
  future_orientation: z.enum(["low", "neutral", "high"]),
  self_efficacy_tone: z.enum(["negative", "neutral", "positive"]),
  entry_length_words: z.number(),
  risk_flag: z.boolean(),
});

const EntryZ = z.object({
  date: z.string(),
  weekday: z.string(),
  mood: z.number(),
  sleep_hrs: z.number(),
  study_hrs: z.number(),
  text: z.string(),
  precomputed_signals: SignalZ.optional(),
});

export const DatasetZ = z.object({
  student: z.object({
    name: z.string(),
    exam: z.string(),
    attempt: z.number().optional(),
    target_date: z.string().optional(),
    context: z.string().optional(),
  }),
  week_label: z.string(),
  baseline: z.object({
    typical_mood: z.number(),
    typical_sleep_hrs: z.number(),
    typical_study_hrs: z.number(),
  }),
  entries: z.array(EntryZ),
});

export function parseDataset(raw: unknown): Dataset {
  return DatasetZ.parse(raw);
}
