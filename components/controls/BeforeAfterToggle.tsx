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
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          disabled={disabled}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
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
