import type { Check } from './Check.ts';

/** A check placed in the report: its row, and the user-agent it ran as, if any. */
export interface CheckResult extends Check {
  row: string;
  agent?: string;
}
