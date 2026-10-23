import type { AboutWeek } from './AboutWeek.ts';

interface SummaryPlanParams {
  /** Whether the week is the one `now` falls in. */
  readonly current: boolean;
  /** The week's record as KV has it, or null when it was never written. */
  readonly stored: AboutWeek | null;
  /** The newest counted commit's short sha, from the log. */
  readonly lastCommit: string;
  readonly now: Date;
  /** False when no model is set up, so past weeks stay open until one can summarize them. */
  readonly canSummarize: boolean;
}

interface SummaryPlan {
  readonly summarize: boolean;
  readonly final: boolean;
}

const REFRESH_MS = 4 * 60 * 60 * 1000;

/**
 * What to do with a week this run, or null to leave its record alone. The current week gets a new summary once it has
 * commits the last one doesn't cover and that one is at least 4 hours old. A past week that isn't final is summarized
 * once more with all of its commits and then marked final, and a final week is never touched again.
 */
export function summaryPlan({ current, stored, lastCommit, now, canSummarize }: SummaryPlanParams): SummaryPlan | null {
  if (!current && stored?.final) return null;
  if (!current) return { summarize: canSummarize, final: canSummarize };

  const summary = stored?.summary;
  if (!summary) return { summarize: canSummarize, final: false };

  const uncovered = summary.through !== lastCommit;
  const due = now.getTime() - new Date(summary.at).getTime() >= REFRESH_MS;
  return { summarize: canSummarize && uncovered && due, final: false };
}
