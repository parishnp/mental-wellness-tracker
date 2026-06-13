import type { WellnessScores } from "@/types/domain";
import { ScoreMeter } from "@/components/ui/ScoreMeter";

export function ScorePanel({ scores }: { scores: WellnessScores }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <ScoreMeter label="Stress" metric={scores.stress} />
      <ScoreMeter label="Anxiety" metric={scores.anxiety} />
      <ScoreMeter label="Burnout" metric={scores.burnout} />
      <ScoreMeter label="Confidence" metric={scores.confidence} />
    </div>
  );
}
