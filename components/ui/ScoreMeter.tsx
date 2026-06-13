import type { ScoredMetric } from "@/types/domain";

function barColor(m: ScoredMetric): string {
  if (m.direction === "positive") {
    if (m.band === "high") return "bg-emerald-500";
    if (m.band === "moderate") return "bg-amber-400";
    return "bg-red-500";
  }
  if (m.band === "severe") return "bg-red-600";
  if (m.band === "high") return "bg-red-500";
  if (m.band === "moderate") return "bg-amber-400";
  return "bg-emerald-500";
}

export function ScoreMeter({
  label,
  metric,
}: {
  label: string;
  metric: ScoredMetric;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-ink">
          {metric.value}
          <span className="ml-1 text-xs font-normal uppercase text-slate-500">
            {metric.band}
          </span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label}: ${metric.value} out of 100, ${metric.band}`}
        aria-valuenow={metric.value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          aria-hidden
          className={`h-full rounded-full transition-all duration-700 ${barColor(metric)}`}
          style={{ width: `${metric.value}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-snug text-slate-500">
        {metric.evidence}
      </p>
    </div>
  );
}
