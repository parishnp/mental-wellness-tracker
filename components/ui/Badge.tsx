import type { ReactNode } from "react";

const TONES = {
  neutral: "bg-slate-100 text-slate-600",
  accent: "bg-blue-50 text-blue-700",
  warn: "bg-red-50 text-red-700",
  good: "bg-emerald-50 text-emerald-700",
} as const;

export function Badge({
  children,
  tone = "neutral",
  title,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
