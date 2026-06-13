// Single source of truth for domain types. Imported across core, ai, and UI.

export type FutureOrientation = "low" | "neutral" | "high";
export type SelfEfficacyTone = "negative" | "neutral" | "positive";

export interface Signal {
  dominant_affect: string;
  themes: string[];
  distortions: string[];
  future_orientation: FutureOrientation;
  self_efficacy_tone: SelfEfficacyTone;
  entry_length_words: number;
  risk_flag: boolean;
}

export interface JournalEntry {
  date: string;
  weekday: string;
  mood: number;
  sleep_hrs: number;
  study_hrs: number;
  text: string;
  precomputed_signals?: Signal;
}

export interface Student {
  name: string;
  exam: string;
  attempt?: number;
  target_date?: string;
  context?: string;
}

export interface Baseline {
  typical_mood: number;
  typical_sleep_hrs: number;
  typical_study_hrs: number;
}

export interface Dataset {
  student: Student;
  week_label: string;
  baseline: Baseline;
  entries: JournalEntry[];
}

export type DatasetId = "before" | "after";

export interface Intervention {
  id: string;
  title: string;
  trigger_state: string;
  base_content: string;
}

export interface WeekdayCluster {
  weekday: string;
  avgMood: number;
  avgNegativity: number;
  count: number;
}

export type TrendLabel = "declining" | "rising" | "flat";

export interface StatsFindings {
  worstDay: string;
  worstDayAvgMood: number;
  nonWorstDayAvgMood: number;
  clusters: WeekdayCluster[];
  sleepMoodLag: string;
  strongerLag: "same-night" | "next-day" | "none";
  entryLengthTrend: TrendLabel;
  moodTrend: TrendLabel;
  recurringNegativeThemes: string[];
  worstDaySleepHrs: number[];
}

export interface MismatchResult {
  date: string;
  weekday: string;
  mood: number;
  mismatch: boolean;
  reason: string;
}

export type CrisisLevel = "none" | "elevated";

export interface CrisisResult {
  level: CrisisLevel;
  riskFlag: boolean;
  triggeredByDate: string | null;
  detectedPhrases: string[];
}

export type ScoreDirection = "problem" | "positive";
export type ScoreBand = "low" | "moderate" | "high" | "severe";

export interface ScoredMetric {
  value: number; // 0-100
  band: ScoreBand;
  direction: ScoreDirection;
  evidence: string;
}

export interface WellnessScores {
  stress: ScoredMetric;
  anxiety: ScoredMetric;
  burnout: ScoredMetric;
  confidence: ScoredMetric;
}

export interface TrajectoryPoint {
  date: string;
  weekday: string;
  label: string;
  mood: number;
  sleep: number;
  length: number;
  isWorstDay: boolean;
}

export interface CoreResult {
  datasetId: DatasetId;
  student: Student;
  baseline: Baseline;
  entries: JournalEntry[];
  signals: Signal[];
  trajectory: TrajectoryPoint[];
  findings: StatsFindings;
  mismatches: MismatchResult[];
  patternDates: string[]; // mismatch ∩ worstDay — the recurring cluster
  scores: WellnessScores;
  crisis: CrisisResult;
  selectedIntervention: Intervention;
}

export interface SafetyView {
  level: CrisisLevel;
  triggeredByDate: string | null;
  message: string;
  resources: {
    region: string;
    primary: string;
    secondary: string;
  } | null;
}

export type AiSource = "live" | "fallback";

export interface AssessmentResult extends CoreResult {
  insight: string;
  personalizedIntervention: string;
  safety: SafetyView;
  sources: { insight: AiSource; personalize: AiSource };
}

// Wire payload: drop the heavy fields the client never reads (efficiency).
export type AnalyzeResponse = Omit<AssessmentResult, "mismatches" | "signals">;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  source: AiSource;
  safety: SafetyView | null;
}
