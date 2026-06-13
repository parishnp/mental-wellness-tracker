// Rule-based intervention selection. The AI never picks freely — it only rewrites wording.
import type { Intervention, Signal, StatsFindings } from "@/types/domain";
import interventionsFile from "@/data/interventions.json";

type InterventionMap = Record<string, Intervention>;
const INTERVENTIONS = (interventionsFile as { interventions: InterventionMap })
  .interventions;

const has = (signals: Signal[], pred: (s: Signal) => boolean): boolean =>
  signals.some(pred);

interface Candidate {
  key: string;
  score: number;
}

export function selectIntervention(
  findings: StatsFindings,
  signals: Signal[],
): Intervention {
  const themes = new Set(signals.flatMap((s) => s.themes));
  const distortionsPresent = has(signals, (s) => s.distortions.length > 0);
  const negEfficacy = has(signals, (s) => s.self_efficacy_tone === "negative");
  const sleepLinked = findings.strongerLag !== "none";
  const mockCluster =
    themes.has("mock_results") &&
    (themes.has("self_comparison") || themes.has("physical_chemistry"));
  const pressure =
    themes.has("family_pressure") ||
    themes.has("financial_burden") ||
    themes.has("guilt");

  const candidates: Candidate[] = [
    {
      key: "post_mock_sunday_reset",
      score: (mockCluster ? 3 : 0) + (sleepLinked ? 2 : 0),
    },
    { key: "sleep_stabilization", score: sleepLinked ? 3 : 0 },
    { key: "thought_reframe", score: distortionsPresent ? 2 : 0 },
    { key: "wins_log", score: negEfficacy ? 2 : 0 },
    { key: "autonomy_reframe", score: pressure ? 1 : 0 },
  ].filter((c) => c.score > 0 && INTERVENTIONS[c.key]);

  candidates.sort((a, b) => b.score - a.score);
  const chosen = candidates[0]?.key ?? "wins_log";
  return INTERVENTIONS[chosen] ?? Object.values(INTERVENTIONS)[0];
}
