import type { ReactNode } from "react";

export function Section({
  title,
  step,
  children,
}: {
  title: string;
  step?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline gap-2">
        {step && (
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            {step}
          </span>
        )}
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}
