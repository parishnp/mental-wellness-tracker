// Pure affect-polarity helpers. No AI, no IO.
// Negativity is a 0..1 scale: 0 = clearly positive, 1 = strongly negative.

const STRONG_NEGATIVE = ["frustration", "hopelessness", "despair", "anger"];
const MILD_NEGATIVE = [
  "mild_frustration",
  "restless_anxiety",
  "anticipatory_anxiety",
  "anxiety",
  "guilt",
  "overwhelm",
];
const MANAGEABLE = ["manageable_anxiety"];
const POSITIVE = [
  "calm",
  "content",
  "confident",
  "hopeful",
  "relieved",
  "steady",
  "recovering",
  "recovered",
  "proud",
];

export function affectNegativity(affect: string): number {
  const a = (affect || "").toLowerCase();
  if (STRONG_NEGATIVE.some((k) => a.includes(k))) return 1;
  if (MILD_NEGATIVE.some((k) => a.includes(k))) return 0.65;
  if (MANAGEABLE.some((k) => a.includes(k))) return 0.4;
  if (POSITIVE.some((k) => a.includes(k))) return 0;
  // Unknown affects: lean on keyword cues, else neutral.
  if (a.includes("anx") || a.includes("frustrat") || a.includes("hopeless")) return 0.8;
  if (a.includes("calm") || a.includes("conf") || a.includes("hope")) return 0;
  return 0.5;
}

export function isNegativeAffect(affect: string): boolean {
  return affectNegativity(affect) >= 0.6;
}

export const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
export const round1 = (x: number): number => Math.round(x * 10) / 10;
