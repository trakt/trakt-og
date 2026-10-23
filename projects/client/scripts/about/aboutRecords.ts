import type { z } from 'zod/v4';
import { aboutRepoSchema } from '../../src/lib/about/aboutRepoSchema.ts';
import { aboutWeekSchema } from '../../src/lib/about/aboutWeekSchema.ts';
import { aboutWeeksSchema } from '../../src/lib/about/aboutWeeksSchema.ts';
import type { AboutWeek } from './AboutWeek.ts';

interface AboutRecordsParams {
  readonly weeks: ReadonlyArray<AboutWeek>;
  readonly index: ReadonlyArray<string> | null;
  readonly repo: z.infer<typeof aboutRepoSchema> | null;
}

interface AboutRecord {
  readonly key: string;
  readonly value: unknown;
}

/**
 * The KV entries to write, each validated against the shape the about page reads. Weeks come before the index, so the
 * index never lists a week that isn't written yet. Throws if any record doesn't match its shape.
 */
export function aboutRecords({ weeks, index, repo }: AboutRecordsParams): ReadonlyArray<AboutRecord> {
  return [
    ...weeks.map((week) => ({ key: `week:${week.week}`, value: aboutWeekSchema.parse(week) })),
    ...(index ? [{ key: 'weeks', value: aboutWeeksSchema.parse(index) }] : []),
    ...(repo ? [{ key: 'repo', value: aboutRepoSchema.parse(repo) }] : []),
  ];
}
