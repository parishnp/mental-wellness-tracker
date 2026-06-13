// Personalize the SELECTED (rule-chosen) intervention's wording. Never invents a new one.
import "server-only";
import type { CoreResult } from "@/types/domain";
import { generateText } from "@/lib/ai/gemini";
import { SYSTEM_PERSONALIZE } from "@/lib/ai/prompts";
import { MODELS } from "@/lib/config/models";

export async function personalize(core: CoreResult): Promise<string | null> {
  const payload = {
    intervention: core.selectedIntervention,
    student: { name: core.student.name, exam: core.student.exam, context: core.student.context },
    detected_pattern: {
      worstDay: core.findings.worstDay,
      patternDates: core.patternDates,
      sleepMoodLag: core.findings.sleepMoodLag,
      themes: core.findings.recurringNegativeThemes,
    },
  };
  try {
    return await generateText({
      model: MODELS.personalize,
      system: SYSTEM_PERSONALIZE,
      user: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}
