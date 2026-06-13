export const dynamic = "force-dynamic";

export default function Methodology() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-2xl font-bold">How it works</h1>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-700">
        <li>
          <strong>Deterministic core (no AI):</strong> weekday mood clustering,
          sleep→mood lag, trend slopes, mood-vs-words mismatch, 0–100 wellness
          scores, intervention selection, and a crisis lexicon screen.
        </li>
        <li>
          <strong>AI language layer (Gemini, server-only):</strong> verbalizes
          the already-proven findings into one insight and personalizes the
          selected intervention&apos;s wording. It never decides math, never
          selects interventions, never handles crisis.
        </li>
        <li>
          <strong>Safety:</strong> rules override the model upward. A lexicon hit
          or a risk-flagged entry forces the helpline card; the model cannot
          downgrade it.
        </li>
      </ol>
    </main>
  );
}
