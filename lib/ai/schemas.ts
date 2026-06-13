// Runtime validator for AI-returned JSON. Reuses the canonical SignalZ schema
// (defined once in lib/data/schema.ts) so the contract lives in a single place.
import type { Signal } from "@/types/domain";
import { SignalZ } from "@/lib/data/schema";

export { SignalZ };

/** Validate an unknown value (e.g. parsed Gemini JSON) as a Signal. Throws on mismatch. */
export function validateSignal(value: unknown): Signal {
  return SignalZ.parse(value);
}
