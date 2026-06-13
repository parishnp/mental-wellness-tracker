import type { JournalEntry } from "@/types/domain";
import { JournalEntryCard } from "@/components/feed/JournalEntryCard";

export function JournalFeed({
  entries,
  highlightDates = [],
  riskDate = null,
}: {
  entries: JournalEntry[];
  highlightDates?: string[];
  riskDate?: string | null;
}) {
  const highlight = new Set(highlightDates);
  return (
    <>
      <p className="mb-3 text-xs text-slate-500">
        Each card is one day. <strong className="text-slate-600">Mood</strong> is
        self-reported on a 1–10 scale (1 = worst, 10 = best);{" "}
        <strong className="text-slate-600">sleep</strong> and{" "}
        <strong className="text-slate-600">study</strong> are hours.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((e) => (
        <JournalEntryCard
          key={e.date}
          entry={e}
          highlight={highlight.has(e.date)}
          flaggedRisk={riskDate === e.date || e.precomputed_signals?.risk_flag === true}
        />
        ))}
      </div>
    </>
  );
}
