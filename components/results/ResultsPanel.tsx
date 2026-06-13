"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type {
  AnalyzeResponse,
  DatasetId,
  JournalEntry,
  Student,
} from "@/types/domain";
import { analyze } from "@/lib/api/analyze";
import { Section } from "@/components/ui/Section";
import { JournalFeed } from "@/components/feed/JournalFeed";
import { InsightCard } from "@/components/results/InsightCard";
import { InterventionCard } from "@/components/results/InterventionCard";
import { ScorePanel } from "@/components/results/ScorePanel";
import { SafetyCard } from "@/components/results/SafetyCard";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { AnalyzeButton } from "@/components/controls/AnalyzeButton";
import { BeforeAfterToggle } from "@/components/controls/BeforeAfterToggle";

// Recharts is heavy and only needed after analysis — keep it out of first load.
const TrajectoryChart = dynamic(
  () => import("@/components/results/TrajectoryChart").then((m) => m.TrajectoryChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full animate-pulse rounded-2xl border border-slate-200 bg-white" />
    ),
  },
);

export default function ResultsPanel({
  student,
  initialEntries,
}: {
  student: Student;
  initialEntries: JournalEntry[];
}) {
  const [datasetId, setDatasetId] = useState<DatasetId>("before");
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const insightRef = useRef<HTMLDivElement>(null);

  // Move focus to the insight after analysis so keyboard/SR users land on the result.
  useEffect(() => {
    if (result) insightRef.current?.focus();
  }, [result]);

  async function runAnalysis(id: DatasetId) {
    setLoading(true);
    setError(null);
    setDatasetId(id);
    try {
      const data = await analyze(id);
      setResult(data);
      setEntries(data.entries);
      setStatus(`Analysis complete for the "${id}" week.`);
    } catch {
      setError("Analysis request failed. Check the dev server and try again.");
      setStatus("Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  const riskDate = result?.safety.triggeredByDate ?? null;
  const highlightDates = result?.patternDates ?? [];

  return (
    <div>
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <AnalyzeButton onClick={() => runAnalysis(datasetId)} loading={loading} />
        {result && (
          <BeforeAfterToggle
            active={datasetId}
            onChange={runAnalysis}
            disabled={loading}
          />
        )}
        {error && (
          <span role="alert" className="text-sm text-red-600">
            {error}
          </span>
        )}
      </div>

      {result && (
        <>
          <Section title="Wellness trajectory" step="Step 1">
            <TrajectoryChart
              data={result.trajectory}
              summary={
                result.patternDates.length > 0
                  ? `Mood, sleep and entry length across ${result.trajectory.length} days. ${result.findings.worstDay} is the worst recurring day: average mood ${result.findings.worstDayAvgMood} versus ${result.findings.nonWorstDayAvgMood} the rest of the week, and those days followed the shortest sleep.`
                  : `Mood, sleep and entry length across ${result.trajectory.length} days. Mood holds steady with no recurring dip.`
              }
            />
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
            <div ref={insightRef} tabIndex={-1} className="outline-none">
              <InsightCard insight={result.insight} source={result.sources.insight} />
            </div>
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

          <Section title="Talk it through" step="Step 5">
            <ChatPanel key={datasetId} datasetId={datasetId} />
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
