// Precomputed demo-safety fallbacks. Used when a live Gemini call returns null/fails.
import type { DatasetId } from "@/types/domain";
import data from "@/data/precomputed-fallbacks.json";

interface FallbackBlock {
  hero_insight: string;
  personalized_intervention: string;
}

const file = data as unknown as Record<DatasetId, FallbackBlock>;

export function fallbackInsight(id: DatasetId): string {
  return file[id]?.hero_insight ?? "";
}

export function fallbackIntervention(id: DatasetId): string {
  return file[id]?.personalized_intervention ?? "";
}
