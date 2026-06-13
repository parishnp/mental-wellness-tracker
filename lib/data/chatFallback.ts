// Deterministic, pattern-aware companion replies for offline/no-key demo runs.
// Pure (no AI, no IO) — lightly adaptive via keyword routing on the student's message.
import type { CoreResult } from "@/types/domain";

export function fallbackReply(core: CoreResult, message: string): string {
  const m = message.toLowerCase();
  const name = core.student.name;
  const worstDay = core.findings.worstDay;
  const routine = core.selectedIntervention.title;

  if (/sleep|tired|night|awake|exhaust/.test(m)) {
    return `That tracks with what your week shows, ${name} — your lowest moods follow your shortest nights. Tonight, try stopping new problems 60 minutes before bed and doing only light revision. Protecting seven hours does more for tomorrow's mood than the extra hour of cramming costs you.`;
  }
  if (/chem|physic|mock|score|rank|behind|compare/.test(m)) {
    return `One mock is a single data point, not a verdict on you. The pattern says ${worstDay}s hit hardest right after results — so cap the review at 15 minutes, note what to fix, and close the laptop. You're measuring a trajectory, not one bad afternoon.`;
  }
  if (/breath|calm|panic|anx|overwhelm|stress/.test(m)) {
    return `Let's slow it down together: breathe in for 4, out for 6, for about a minute — the longer exhale is what settles the nervous system. Then pick just the next one task, not the whole syllabus. You don't have to carry all of it at once.`;
  }
  return `I hear you, ${name}. Given your "${routine}" plan and the ${worstDay} pattern we found, what feels heaviest right now — the sleep, the mocks, or the pressure? We can take just that one piece next.`;
}
