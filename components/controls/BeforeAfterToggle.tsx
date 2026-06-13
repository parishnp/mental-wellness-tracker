"use client";

import type { DatasetId } from "@/types/domain";

export function BeforeAfterToggle({
  active,
  onChange,
  disabled,
}: {
  active: DatasetId;
  onChange: (id: DatasetId) => void;
  disabled: boolean;
}) {
  const options: { id: DatasetId; label: string }[] = [
    { id: "before", label: "Before" },
    { id: "after", label: "After 2 weeks" },
  ];
  return (
    <div
      role="group"
      aria-label="Compare before and after the routine"
      className="inline-flex rounded-xl border border-slate-200 bg-white p-1"
    >
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          disabled={disabled}
          aria-pressed={active === o.id}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50 ${
            active === o.id
              ? "bg-accent text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
