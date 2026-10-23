import type { AboutWeek } from './AboutWeek.ts';

/** A week's written part: its title and themes, plus the commit it covers and when it was written. */
export type AboutSummary = NonNullable<AboutWeek['summary']>;
