// "Said fine, wrote distressed" detection. Pure.
import type { JournalEntry, MismatchResult, Signal } from "@/types/domain";
import { isNegativeAffect } from "@/lib/core/affect";

export function evaluateMismatches(
  entries: JournalEntry[],
  signals: Signal[],
): MismatchResult[] {
  return entries.map((e, i) => {
    const s = signals[i];
    const negTone = s?.self_efficacy_tone === "negative";
    const negAffect = s ? isNegativeAffect(s.dominant_affect) : false;
    const mismatch = e.mood >= 5 && (negTone || negAffect);
    const reason = mismatch
      ? `Logged mood ${e.mood}/10 but wrote with ${negTone ? "negative self-efficacy" : "negative affect"}${
          s?.distortions.length ? ` and ${s.distortions.join(", ")}` : ""
        }.`
      : "Mood and written affect are aligned.";
    return { date: e.date, weekday: e.weekday, mood: e.mood, mismatch, reason };
  });
}
