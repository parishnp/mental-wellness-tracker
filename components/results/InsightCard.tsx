import type { AiSource } from "@/types/domain";
import { Badge } from "@/components/ui/Badge";

export function InsightCard({
  insight,
  source,
}: {
  insight: string;
  source: AiSource;
}) {
  return (
    <div className="animate-fade-up rounded-2xl border border-accent/40 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm animate-pulse-soft">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent">
          The hidden pattern
        </span>
        <Badge tone={source === "live" ? "good" : "neutral"}>
          {source === "live" ? "Gemini" : "cached"}
        </Badge>
      </div>
      <p className="text-lg font-medium leading-relaxed text-ink">{insight}</p>
    </div>
  );
}
