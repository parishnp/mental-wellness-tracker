# ExamCompanion

Finds the hidden stress pattern in a student's journal (the "Sunday problem") and turns it into a personalized, exam-culture-aware intervention — with a rules-based crisis guardrail.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Recharts · Gemini (`@google/genai`).

## Architecture

Two strictly separated layers:

- **`lib/core/*` — deterministic (no AI):** weekday clustering, sleep→mood lag, trends, mood-vs-words mismatch, 0–100 wellness scores, crisis lexicon screen, intervention selection. Pure and unit-testable.
- **`lib/ai/*` — Gemini, server-only (`import "server-only"`):** verbalizes the proven findings into the insight and personalizes the _selected_ intervention. Never decides math/selection/safety.

Safety: rules override the model **upward**. A lexicon hit or risk-flagged entry forces the helpline card; the model cannot suppress it.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

The demo runs **fully offline** using `data/precomputed-fallbacks.json` when no key is set.

### Enable live Gemini (optional)

```bash
cp .env.example .env
# set GEMINI_API_KEY=...   (server-side only; never NEXT_PUBLIC_)
```

With a key, the insight + intervention wording come from Gemini live, falling back to the precomputed text on any failure. The key never reaches the client bundle.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build (typecheck + lint)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint (`next/core-web-vitals` ruleset), zero-warning gate

## Flow

`app/page.tsx` (server) renders the journal feed → `POST /api/analyze` runs the deterministic pipeline then Gemini (insight + personalize, each with fallback) → `ResultsPanel` renders trajectory chart, hero insight, wellness scores, personalized routine, and the safety card. The Before/After toggle re-runs against `seed-after.json`.

## Write your own entry

The **"Write today's entry"** box (`components/journal/ReflectBox.tsx` → `POST /api/reflect`) is the live-journaling path: the student writes their own open-ended reflection and logs today's mood, and Gemini extracts the affect, themes, and CBT thinking-patterns from _their_ words. Untrusted free text is screened by the deterministic crisis lexicon **before** the model runs, length-capped, and rate-limited; offline it returns a neutral signal so the path still works without a key.

## API routes

- `POST /api/analyze` — `{ datasetId }` → full pipeline result + AI-phrased insight/intervention (memoized per dataset).
- `POST /api/reflect` — `{ text, mood?, sleep_hrs?, study_hrs? }` → GenAI-extracted signal for the student's own entry, crisis-gated.
- `POST /api/chat` — `{ datasetId, message, history }` → grounded companion reply; crisis messages are intercepted before any model call.
