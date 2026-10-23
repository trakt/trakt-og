import { addDays } from '../../src/lib/utils/addDays.ts';
import { uniqueBy } from '../../src/lib/utils/uniqueBy.ts';
import type { AboutWeek } from './AboutWeek.ts';
import type { CommitAuthor } from './CommitAuthor.ts';
import type { CountedCommit } from './CountedCommit.ts';
import { mondayOf } from './mondayOf.ts';
import type { Summarize } from './Summarize.ts';
import { summaryPlan } from './summaryPlan.ts';
import { toAboutWeek } from './toAboutWeek.ts';

interface BuildAboutWeeksParams {
  /** Every counted commit since og began, newest first. */
  readonly commits: ReadonlyArray<CountedCommit>;
  readonly authors: ReadonlyMap<string, CommitAuthor>;
  /** Reads a week's stored record, or null when it was never written. */
  readonly stored: (week: string) => Promise<AboutWeek | null>;
  /** Null when no model is set up. */
  readonly summarize: Summarize | null;
  readonly now: Date;
}

interface AboutWeeks {
  /** The week records to write. Final weeks are left out. */
  readonly weeks: ReadonlyArray<AboutWeek>;
  /** Every week with counted commits, newest first. */
  readonly index: ReadonlyArray<string>;
}

const subjectLine = ({ type, scope, subject }: CountedCommit) => `${type}${scope ? `(${scope})` : ''}: ${subject}`;

/**
 * Builds the week records a run writes, one week at a time so model calls never overlap. A week keeps its stored
 * summary whenever no new one is due or the new one fails its checks.
 */
export async function buildAboutWeeks(
  { commits, authors, stored, summarize, now }: BuildAboutWeeksParams,
): Promise<AboutWeeks> {
  const index = uniqueBy(commits, ({ week }) => week).map(({ week }) => week);
  const current = mondayOf(now);

  const buildWeek = async (week: string): Promise<AboutWeek | null> => {
    const ofWeek = commits.filter((commit) => commit.week === week);
    const lastCommit = ofWeek.at(0)?.sha.slice(0, 7) ?? '';
    const previous = await stored(week);
    const plan = summaryPlan({
      current: week === current,
      stored: previous,
      lastCommit,
      now,
      canSummarize: !!summarize,
    });
    if (!plan) return null;

    const draft = plan.summarize && summarize
      ? await summarize({ week, from: week, to: addDays(week, 6), subjects: ofWeek.map(subjectLine) }).catch(() => null)
      : null;
    const summary = draft ? { ...draft, through: lastCommit, at: now.toISOString() } : previous?.summary ?? null;

    return toAboutWeek({ week, commits: ofWeek, authors, summary, final: plan.final, now });
  };

  const weeks = await index.reduce<Promise<ReadonlyArray<AboutWeek>>>(async (built, week) => {
    const done = await built;
    const next = await buildWeek(week);
    return next ? [...done, next] : done;
  }, Promise.resolve([]));

  return { weeks, index };
}
