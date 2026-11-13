export type Lang = "ru" | "it" | "en";

/** How much help the child needed for a step (prompt hierarchy, least to most). */
export type AssistLevel = "independent" | "gesture" | "verbal" | "physical";

export interface Step {
  id: string;
  title: string;
  /** Emoji used when there is no photo. */
  icon: string;
  /** Optional photo as a small data URL (real objects work better than icons for many children). */
  photo?: string;
  /** Optional visual timer, in minutes. */
  minutes?: number;
}

export interface Reward {
  title: string;
  icon: string;
  photo?: string;
  /** How long the reward lasts. Shown on the final screen so the end is clear. */
  minutes?: number;
}

export interface Schedule {
  id: string;
  name: string;
  steps: Step[];
  /** The "then" of first-then. */
  reward: Reward;
}

export interface SessionStep {
  stepId: string;
  title: string;
  icon: string;
  /** Filled in later by the parent. */
  assist: AssistLevel | null;
  secondsTaken: number;
}

export interface Session {
  id: string;
  scheduleId: string;
  scheduleName: string;
  startedAt: number;
  finishedAt?: number;
  steps: SessionStep[];
  note?: string;
}

/** A run in progress, kept so the app can resume after being closed. */
export interface Run {
  scheduleId: string;
  startedAt: number;
  stepIndex: number;
  stepStartedAt: number;
  done: SessionStep[];
}

/** Antecedent - Behaviour - Consequence entry, for the clinician. */
export interface AbcEntry {
  id: string;
  at: number;
  antecedent: string;
  behavior: string;
  consequence: string;
  durationMin?: number;
  intensity?: 1 | 2 | 3;
  note?: string;
}

export interface Settings {
  lang: Lang;
  pin: string;
  sound: boolean;
  /** Fewer and gentler animations, no sparkles. */
  calmMotion: boolean;
}

export interface AppState {
  v: 1;
  settings: Settings;
  schedules: Schedule[];
  activeScheduleId: string;
  run: Run | null;
  sessions: Session[];
  abc: AbcEntry[];
}
