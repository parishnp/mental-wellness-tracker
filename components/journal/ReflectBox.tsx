"use client";

import { useRef, useState } from "react";
import type { ReflectResponse } from "@/types/domain";
import { reflect } from "@/lib/api/reflect";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SafetyCard } from "@/components/results/SafetyCard";

// The student's own journaling input: write today's entry in your own words and
// see what the companion's GenAI layer reads in it — affect, themes, and any
// cognitive distortions — with the same rule-decided crisis guardrail as the rest
// of the app. Runs against precomputed-neutral output offline; live with a key.
export function ReflectBox() {
  const [text, setText] = useState("");
  const [mood, setMood] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReflectResponse | null>(null);
  const [status, setStatus] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entry = text.trim();
    if (!entry || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await reflect({ text: entry, mood });
      setResult(res);
      setStatus(
        res.safety?.level === "elevated"
          ? "Support resources are shown below."
          : "Reflection analyzed.",
      );
      // Move focus to the result so keyboard / screen-reader users land on it.
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch {
      setError("Couldn't analyze that just now. Please try again.");
      setStatus("Reflection failed.");
    } finally {
      setLoading(false);
    }
  }

  const s = result?.signal;

  return (
    <Card>
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
      <form onSubmit={onSubmit}>
        <label
          htmlFor="reflect-text"
          className="block text-sm font-medium text-slate-700"
        >
          How did today actually go? Write freely — a few honest lines.
        </label>
        <textarea
          id="reflect-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="e.g. Told myself the mock went fine, but I keep replaying the physics section…"
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label
            htmlFor="reflect-mood"
            className="text-sm font-medium text-slate-700"
          >
            Today&apos;s mood (1 worst – 10 best)
          </label>
          <input
            id="reflect-mood"
            type="number"
            min={1}
            max={10}
            value={mood}
            onChange={(e) =>
              setMood(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
            }
            className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <button
            type="submit"
            disabled={loading || text.trim().length === 0}
            aria-busy={loading}
            className="ml-auto rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Reading…" : "Reflect"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {s && (
        <div
          ref={resultRef}
          tabIndex={-1}
          className="mt-4 border-t border-slate-100 pt-4 outline-none"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              What the companion read
            </h3>
            <Badge tone={result?.source === "live" ? "good" : "neutral"}>
              {result?.source === "live" ? "Gemini" : "offline"}
            </Badge>
          </div>
          <dl className="mt-2 space-y-1 text-sm text-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <dt className="font-medium">Affect:</dt>
              <dd>
                <Badge tone="accent">{s.dominant_affect}</Badge>
              </dd>
            </div>
            {s.themes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <dt className="font-medium">Themes:</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {s.themes.map((t) => (
                    <Badge key={t} tone="neutral">
                      {t}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
            {s.distortions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <dt className="font-medium">Thinking patterns:</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {s.distortions.map((d) => (
                    <Badge key={d} tone="warn">
                      {d}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            The companion reads patterns in your words — it does not diagnose.
            Safety is rule-decided; the model can never suppress an escalation.
          </p>
        </div>
      )}

      {result?.safety && <SafetyCard safety={result.safety} />}
    </Card>
  );
}
