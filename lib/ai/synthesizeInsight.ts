// The HERO call: verbalize already-proven findings into one striking insight.
import "server-only";
import type { CoreResult } from "@/types/domain";
import { buildInsightInput } from "@/lib/core/pipeline";
import { generateText } from "@/lib/ai/gemini";
import { SYSTEM_INSIGHT } from "@/lib/ai/prompts";
import { MODELS } from "@/lib/config/models";

export async function synthesizeInsight(core: CoreResult): Promise<string | null> {
  try {
    return await generateText({
      model: MODELS.insight,
      system: SYSTEM_INSIGHT,
      user: JSON.stringify(buildInsightInput(core)),
    });
  } catch {
    return null;
  }
}
