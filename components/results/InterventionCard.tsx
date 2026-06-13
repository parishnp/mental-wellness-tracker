import type { AiSource, Intervention } from "@/types/domain";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function InterventionCard({
  intervention,
  personalized,
  source,
}: {
  intervention: Intervention;
  personalized: string;
  source: AiSource;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">{intervention.title}</h3>
        <Badge tone={source === "live" ? "good" : "neutral"}>
          {source === "live" ? "Gemini" : "cached"}
        </Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{personalized}</p>
      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        Rule-selected from the vetted set ({intervention.id}); the model only
        rewrote the wording.
      </p>
    </Card>
  );
}
