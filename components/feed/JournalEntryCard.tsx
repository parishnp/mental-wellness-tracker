import { memo } from "react";
import type { JournalEntry } from "@/types/domain";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function JournalEntryCardImpl({
  entry,
  highlight = false,
  flaggedRisk = false,
}: {
  entry: JournalEntry;
  highlight?: boolean;
  flaggedRisk?: boolean;
}) {
  const s = entry.precomputed_signals;
  const lowSleep = entry.sleep_hrs <= 4;

  const moodLabel =
    entry.mood <= 2
      ? "really low"
      : entry.mood <= 4
        ? "low"
        : entry.mood <= 6
          ? "okay"
          : entry.mood <= 8
            ? "good"
            : "great";

  return (
    <Card
      className={
        highlight
          ? "border-accent/60 ring-2 ring-accent/30"
          : flaggedRisk
            ? "border-red-300 ring-2 ring-red-200"
            : ""
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">
            {entry.weekday}
          </span>
          <span className="text-xs text-slate-500">{entry.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            tone="accent"
            title="Self-reported daily mood, 1 (worst) to 10 (best)"
          >
            Mood {entry.mood}/10 · {moodLabel}
          </Badge>
          <Badge
            tone={lowSleep ? "warn" : "neutral"}
            title="Hours slept the night before"
          >
            <span aria-hidden>😴</span> {entry.sleep_hrs}h sleep
          </Badge>
          <Badge tone="neutral" title="Hours studied that day">
            <span aria-hidden>📚</span> {entry.study_hrs}h study
          </Badge>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-700">
        {entry.text}
      </p>

      {s && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="neutral">{s.dominant_affect}</Badge>
          {s.themes.slice(0, 3).map((t) => (
            <Badge key={t} tone="neutral">
              {t}
            </Badge>
          ))}
          {flaggedRisk && <Badge tone="warn">risk flag</Badge>}
        </div>
      )}
    </Card>
  );
}

// Memoized: the feed renders 11 of these and they're pure given their props.
export const JournalEntryCard = memo(JournalEntryCardImpl);
