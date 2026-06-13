import { loadDataset } from "@/lib/data/loadDataset";
import ResultsPanel from "@/components/results/ResultsPanel";

export default function Page() {
  const before = loadDataset("before");
  const { student } = before;

  return (
    <main id="main" className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          ExamCompanion
        </p>
        <h1 className="mt-1 text-3xl font-bold text-ink">
          The pattern {student.name} couldn&apos;t see
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          {student.name} · {student.exam} attempt {student.attempt ?? "—"}.{" "}
          {student.context}
        </p>
      </header>

      <ResultsPanel student={student} initialEntries={before.entries} />

      <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-400">
        Deterministic core finds the pattern and screens for risk; Gemini only
        phrases the insight and personalizes the vetted routine. Safety is
        rule-decided and the model can never suppress it.
      </footer>
    </main>
  );
}
