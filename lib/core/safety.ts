// Deterministic safety view. Built from the rules-based crisis result — never the model.
import type { CrisisResult, SafetyView } from "@/types/domain";

export const HELPLINE = {
  region: "India",
  primary: "Tele-MANAS — call 14416 (24x7, government mental health support)",
  secondary: "iCall — 9152987821 (Mon–Sat, 8am–10pm)",
};

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
