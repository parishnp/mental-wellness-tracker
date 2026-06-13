# ExamCompanion — Full Audit (Code Quality · Security · Efficiency · Accessibility · Testing · Problem-Statement Alignment)

**Method:** researched current best practices online (sources cited per section), audited the codebase statically, implemented the gaps, then verified at runtime (typecheck, coverage, production build, served-build header/behavior checks).

| Area | Status | Verified by |
|---|---|---|
| Code Quality | ✅ | `tsc --noEmit` clean; typed boundaries; Zod-validated data; Prettier config |
| Security | ✅ (1 documented residual) | served-build header check; nonce wiring; `npm audit` |
| Efficiency | ✅ | build bundle report (First Load JS 191 kB → 92.7 kB) |
| Accessibility | ✅ | axe WCAG A/AA test (0 violations); manual landmark/focus review |
| Testing | ✅ | 35+ tests; coverage stmts 98.7 / branches 86.3 / funcs 100 / lines 100 (lib/core) |
| Problem Alignment | ✅ | grounded conversational companion + crisis gate verified at runtime |

---

## 1. Code Quality
**Standards:** strict typing, single source of truth, validation at boundaries, no dead code, consistent formatting.

- Strict TS end-to-end (`strict: true`), one `types/domain.ts` as the single source of truth.
- **Two-layer architecture enforced by the module system:** `lib/core/*` is pure (no AI/IO); `lib/ai/*` imports `server-only` so AI code is a *compile error* in the client bundle.
- **Boundary validation:** seed data is parsed with Zod (`lib/data/schema.ts`) at import — removed all `as unknown as` casts. Gemini JSON is validated with Zod (`lib/ai/schemas.ts`).
- Typed API clients (`lib/api/analyze.ts`, `lib/api/chat.ts`) keep `fetch`/JSON out of components.
- Dead exports pruned (`hasGemini` removed); Prettier config (`.prettierrc`) + `format`/`format:check` scripts added.

## 2. Security
**Standards:** [Next.js CSP guide](https://nextjs.org/docs/14/app/building-your-application/configuring/content-security-policy), [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/), [OWASP HSTS cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html).

- **Nonce-based strict CSP** via `middleware.ts`: `script-src 'self' 'nonce-<per-request>' 'strict-dynamic'` — **no `'unsafe-inline'` for scripts**. `style-src` keeps `'unsafe-inline'` because Recharts/score-bars use inline style *attributes* (nonces don't cover those; styles are a far lower injection risk). Verified at runtime: every inline script carries the nonce (0 un-nonced inline scripts), so hydration works under `strict-dynamic`.
- **Hardening headers** (verified on served build): `Strict-Transport-Security: max-age=63072000; includeSubDomains` (no `preload`, per OWASP advice), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`.
- **Secret isolation:** `GEMINI_API_KEY` is server-only (never `NEXT_PUBLIC_`), used only behind `import "server-only"`.
- **Input safety:** both API routes validate bodies with Zod; `/api/analyze` accepts only a dataset enum (no client-supplied text reaches the model). Per-IP rate limiting on both routes (`lib/security/rateLimit.ts`, unit-tested). The chat companion is **crisis-gated**: a deterministic lexicon (`screenText`) intercepts self-harm/hopelessness *before any model call* and returns the helpline — the model never handles crisis.
- **Untrusted text** sent to the model (chat, signal extraction) is delimited and length-capped.

**Residual (documented, not auto-fixed):** `npm audit` reports advisories in Next 14.2.x — most do not apply to this app (we use no `next/image`, rewrites, or RSC fetch-cache), but **GHSA-ffhc-5mcf-pf4q (XSS with CSP nonces)** is relevant. Full remediation requires upgrading to **Next ≥ 16.2.9** (a major upgrade pulling React 19, which needs its own Recharts/Testing-Library compatibility pass). This was deliberately **not** applied blind to avoid destabilizing the verified build; it is the single recommended follow-up. Next was bumped to the latest non-breaking patch (`^14.2.35`).

## 3. Efficiency
**Standards:** minimal client JS, avoid redundant work/payload, parallelism.

- **Recharts lazy-loaded** (`next/dynamic`, `ssr:false`) — **`/` First Load JS dropped 191 kB → 92.7 kB**.
- **In-memory AI cache** per dataset in `/api/analyze` — re-analyze/toggle never re-calls Gemini.
- **Trimmed payload** — dropped client-unused `mismatches[]`/`signals[]` from the response.
- `Promise.all` on the two AI calls; deterministic core computed first and returned even if AI fails; `React.memo` on the repeated journal card.

## 4. Accessibility
**Standards:** [WCAG 2.2 AA](https://www.w3.org/WAI/WCAG22/Techniques/) — incl. SCR40 (reduced motion) and SC 2.4.11 (focus not obscured).

- **Automated axe WCAG A/AA check** in the test suite — **0 violations** after analysis.
- Skip-to-content link; `<main id="main">` landmark; logical heading order.
- **`prefers-reduced-motion`** media query disables animations (SCR40).
- **Focus management:** focus moves to the insight after analysis; an `aria-live="polite"` status announces completion to screen readers.
- Score bars are `role="progressbar"` with names; chart is `role="img"` with a text summary; safety is `role="alert"`; decorative emoji `aria-hidden`; `focus-visible` rings; accent darkened to `#2563eb` for AA contrast; labeled chat input.

## 5. Testing
**Standards:** [Vitest coverage](https://vitest.dev/config/coverage) with thresholds; unit + component + a11y.

- **35+ tests** across core logic, the rate limiter, a Testing-Library interaction test, and the axe a11y assertion.
- **Coverage thresholds enforced** on `lib/core` (`test:coverage`): statements 98.7%, branches 86.3%, functions 100%, lines 100% (thresholds 85/80/85/85).
- Safety-critical paths covered: crisis lexicon (`screen`/`screenText`), `buildSafetyView`, intervention selection branches, before/after pipeline outcomes.
- A real bug was caught by coverage work: `"manageable_anxiety"` was mis-scored as mild-negative (substring of `"anxiety"`); fixed the match order in `affect.ts`.

## 6. Problem-Statement Alignment
**Brief asks for:** a smart, dynamic, conversational companion with real-time tailored coping and a safety guardrail, built around one persona/vertical.

- **Persona/vertical:** Aarav, a NEET dropper in a Kota hostel — exam-stress vertical, end to end.
- **Smart + logical decision-making on context:** deterministic core finds the hidden weekday pattern, computes wellness scores, and *selects* the intervention by rule; AI only verbalizes/personalizes.
- **Conversational companion:** `/api/chat` + `ChatPanel` — grounded in the detected pattern, with adaptive coping suggestions; verified returning live Gemini replies, with a deterministic offline fallback.
- **Safety:** rules override the model upward; crisis is escalated to the helpline (Tele-MANAS 14416), never handled conversationally.

---

## Verification commands
```
npm run typecheck        # clean
npm run test:coverage    # 35+ tests pass; thresholds met
npm run build            # succeeds; / and /methodology dynamic; First Load JS 92.7 kB
npm audit                # advisories documented above
# served build: CSP nonce + HSTS/headers confirmed; /api/analyze + /api/chat verified
```

## Sources
- [Next.js — Content Security Policy (nonce + middleware)](https://nextjs.org/docs/14/app/building-your-application/configuring/content-security-policy)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [OWASP HSTS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html)
- [W3C WCAG 2.2 Techniques](https://www.w3.org/WAI/WCAG22/Techniques/)
- [Vitest — Coverage config](https://vitest.dev/config/coverage)
- Next.js advisory GHSA-ffhc-5mcf-pf4q (XSS with CSP nonces) and related, via `npm audit`.
