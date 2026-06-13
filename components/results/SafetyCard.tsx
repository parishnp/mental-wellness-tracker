import type { SafetyView } from "@/types/domain";

export function SafetyCard({ safety }: { safety: SafetyView }) {
  if (safety.level !== "elevated" || !safety.resources) return null;
  return (
    <div
      role="alert"
      aria-label="Support resources"
      className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 p-5"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-lg">
          🤝
        </span>
        <h3 className="text-base font-semibold text-red-800">
          Let&apos;s get you real support
        </h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-red-900/90">{safety.message}</p>
      <div className="mt-3 space-y-1 text-sm font-medium text-red-900">
        <p>{safety.resources.primary}</p>
        <p>{safety.resources.secondary}</p>
      </div>
      {safety.triggeredByDate && (
        <p className="mt-3 text-xs text-red-700/70">
          Triggered by the entry on {safety.triggeredByDate} · rule-decided, model
          cannot suppress.
        </p>
      )}
    </div>
  );
}
