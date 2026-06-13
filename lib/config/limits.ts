// Centralized request limits — single source for the values the route handlers
// and AI layer enforce, instead of scattering magic numbers across files.

/** Per-IP requests/minute, by endpoint. */
export const RATE_LIMITS = {
  analyze: 20,
  chat: 30,
  reflect: 20,
} as const;

/** Maximum sizes for untrusted input (characters / items). */
export const MAX_INPUT = {
  journalText: 2000,
  chatMessage: 1000,
  chatHistory: 12,
} as const;
