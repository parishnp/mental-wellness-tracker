# ExamCompanion

Finds the hidden stress pattern in a student's journal (the "Sunday problem") and turns it into a personalized, exam-culture-aware intervention — with a rules-based crisis guardrail.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Recharts · Gemini (`@google/genai`).

## Architecture
Two strictly separated layers:
- **`lib/core/*` — deterministic (no AI):** weekday clustering, sleep→mood lag, trends, mood-vs-words mismatch, 0–100 wellness scores, crisis lexicon screen, intervention selection. Pure and unit-testable.
- **`lib/ai/*` — Gemini, server-only (`import "server-only"`):** verbalizes the proven findings into the insight and personalizes the *selected* intervention. Never decides math/selection/safety.

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
- `npm run lint` — Next ESLint

## Flow
`app/page.tsx` (server) renders the journal feed → `POST /api/analyze` runs the deterministic pipeline then Gemini (insight + personalize, each with fallback) → `ResultsPanel` renders trajectory chart, hero insight, wellness scores, personalized routine, and the safety card. The Before/After toggle re-runs against `seed-after.json`.
