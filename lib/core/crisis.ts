// Deterministic crisis screen. Rules override the model UPWARD on safety, never down.
import type { CrisisResult, JournalEntry, Signal } from "@/types/domain";

// Explicit, high-specificity phrases only — kept narrow to avoid false alarms.
const LEXICON = [
  "better off without",
  "burden",
  "can't go on",
  "cant go on",
  "no point in living",
  "end it all",
  "kill myself",
  "hurt myself",
  "want to disappear",
  "wish i wasn't here",
  "wish i wasnt here",
];

/** Lexicon screen on raw text. Used by the journal screen and the chat safety gate. */
export function screenText(text: string): string[] {
  const t = (text || "").toLowerCase();
  return [...new Set(LEXICON.filter((p) => t.includes(p)))];
}

export function screenEntry(entry: JournalEntry, signal?: Signal): string[] {
  const hits = screenText(entry.text);
  if (signal?.risk_flag) hits.push("[signal.risk_flag]");
  return [...new Set(hits)];
}

export function screen(
  entries: JournalEntry[],
  signals: Signal[],
): CrisisResult {
  let triggeredByDate: string | null = null;
  const detectedPhrases: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const hits = screenEntry(entries[i], signals[i]);
    if (hits.length) {
      if (!triggeredByDate) triggeredByDate = entries[i].date;
      detectedPhrases.push(...hits);
    }
  }
  const elevated = detectedPhrases.length > 0;
  return {
    level: elevated ? "elevated" : "none",
    riskFlag: signals.some((s) => s.risk_flag),
    triggeredByDate,
    detectedPhrases: [...new Set(detectedPhrases)],
  };
}
