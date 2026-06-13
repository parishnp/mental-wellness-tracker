"use client";

import { useState } from "react";
import type {
  AssessmentResult,
  DatasetId,
  JournalEntry,
  Student,
} from "@/types/domain";
import { Section } from "@/components/ui/Section";
import { JournalFeed } from "@/components/feed/JournalFeed";
import { TrajectoryChart } from "@/components/results/TrajectoryChart";
import { InsightCard } from "@/components/results/InsightCard";
import { InterventionCard } from "@/components/results/InterventionCard";
import { ScorePanel } from "@/components/results/ScorePanel";
import { SafetyCard } from "@/components/results/SafetyCard";
import { AnalyzeButton } from "@/components/controls/AnalyzeButton";
import { BeforeAfterToggle } from "@/components/controls/BeforeAfterToggle";

export default function ResultsPanel({
  student,
  initialEntries,
}: {
  student: Student;
  initialEntries: JournalEntry[];
}) {
  const [datasetId, setDatasetId] = useState<DatasetId>("before");
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(id: DatasetId) {
    setLoading(true);
    setError(null);
    setDatasetId(id);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId: id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AssessmentResult = await res.json();
      setResult(data);
      setEntries(data.entries);
    } catch {
      setError("Analysis request failed. Check the dev server and try again.");
    } finally {
      setLoading(false);
    }
  }

  const riskDate = result?.safety.triggeredByDate ?? null;
  const highlightDates = result?.patternDates ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <AnalyzeButton onClick={() => analyze(datasetId)} loading={loading} />
        {result && (
          <BeforeAfterToggle
            active={datasetId}
            onChange={analyze}
            disabled={loading}
          />
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {result && (
        <>
          <Section title="Wellness trajectory" step="Step 1">
            <TrajectoryChart data={result.trajectory} />
            {result.patternDates.length > 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                Worst recurring day:{" "}
                <strong className="text-ink">{result.findings.worstDay}</strong>{" "}
                · avg mood {result.findings.worstDayAvgMood} vs{" "}
                {result.findings.nonWorstDayAvgMood} the rest of the week.
              </p>
            ) : (
              <p className="mt-2 text-xs text-emerald-600">
                No recurring dip this week — mood holds steady across the days.
              </p>
            )}
          </Section>

          <Section title="What the numbers hid" step="Step 2">
            <InsightCard insight={result.insight} source={result.sources.insight} />
          </Section>

          <Section title="Your scores" step="Step 3">
            <ScorePanel scores={result.scores} />
          </Section>

          <Section title="A routine built for you" step="Step 4">
            <InterventionCard
              intervention={result.selectedIntervention}
              personalized={result.personalizedIntervention}
              source={result.sources.personalize}
            />
            <SafetyCard safety={result.safety} />
          </Section>
        </>
      )}

      <Section
        title={result ? "The week, entry by entry" : "Aarav's journal"}
        step={result ? "Source" : "Start here"}
      >
        <JournalFeed
          entries={entries}
          highlightDates={highlightDates}
          riskDate={riskDate}
        />
      </Section>
    </div>
  );
}
