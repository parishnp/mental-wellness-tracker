// Grounded conversational companion. Server-only. Returns null on no-key/failure
// so the route falls back to a deterministic, pattern-aware reply.
import "server-only";
import type { ChatMessage, CoreResult } from "@/types/domain";
import { generateText } from "@/lib/ai/gemini";
import { SYSTEM_CHAT } from "@/lib/ai/prompts";
import { MODELS } from "@/lib/config/models";

export function chatContext(core: CoreResult) {
  return {
    student: { name: core.student.name, exam: core.student.exam },
    worstDay: core.findings.worstDay,
    patternDates: core.patternDates,
    scores: {
      stress: core.scores.stress.value,
      anxiety: core.scores.anxiety.value,
      burnout: core.scores.burnout.value,
      confidence: core.scores.confidence.value,
    },
    selectedRoutine: core.selectedIntervention.title,
    recurringThemes: core.findings.recurringNegativeThemes,
  };
}

export async function companionReply(
  core: CoreResult,
  message: string,
  history: ChatMessage[],
): Promise<string | null> {
  const convo = history
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Student" : "Companion"}: ${m.content}`)
    .join("\n");
  const user = `CONTEXT (already computed; do not contradict):\n${JSON.stringify(chatContext(core))}\n\nConversation so far:\n${convo || "(none)"}\n\n<message>\n${message.slice(0, 1000)}\n</message>\n\nReply as ExamCompanion.`;
  try {
    return await generateText({ model: MODELS.chat, system: SYSTEM_CHAT, user });
  } catch {
    return null;
  }
}
