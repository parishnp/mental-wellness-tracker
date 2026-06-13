// Deterministic safety view. Built from the rules-based crisis result — never the model.
import type { CrisisResult, SafetyView } from "@/types/domain";

export const HELPLINE = {
  region: "India",
  primary: "Tele-MANAS — call 14416 (24x7, government mental health support)",
  secondary: "iCall — 9152987821 (Mon–Sat, 8am–10pm)",
};

/** The fixed, warm escalation reply the chat companion returns on a crisis hit —
 *  it never attempts to counsel; it hands off to a person. */
export const CRISIS_CHAT_REPLY =
  "I'm really glad you told me this, and I don't want you to carry it alone. This is bigger than what I can help with here — please reach out to one of the people below right now. They're there for exactly this.";

/** Build an elevated SafetyView directly from detected crisis phrases.
 *  Used by the chat and journaling routes where rules screen raw user text. */
export function escalatedSafetyView(
  detectedPhrases: string[],
  riskFlag = true,
): SafetyView {
  return buildSafetyView({
    level: "elevated",
    riskFlag,
    triggeredByDate: null,
    detectedPhrases,
  });
}

export function buildSafetyView(crisis: CrisisResult): SafetyView {
  if (crisis.level === "elevated") {
    return {
      level: "elevated",
      triggeredByDate: crisis.triggeredByDate,
      message:
        "A recent entry carried language about feeling like a burden. ExamCompanion does not try to handle this in conversation — it surfaces a warm, immediate path to a person who can help.",
      resources: HELPLINE,
    };
  }
  return {
    level: "none",
    triggeredByDate: null,
    message: "No risk signals detected this week.",
    resources: null,
  };
}
