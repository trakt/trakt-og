import type { AboutSummary } from './AboutSummary.ts';

/** What the model writes for a week, before it's stamped with the commit it covers. */
export type SummaryDraft = Pick<AboutSummary, 'title' | 'themes'>;
