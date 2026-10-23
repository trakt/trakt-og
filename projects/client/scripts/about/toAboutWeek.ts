import { aboutSections } from '../../src/lib/about/aboutSections.ts';
import type { AboutSection } from '../../src/lib/about/AboutSection.ts';
import { sectionOfScope } from '../../src/lib/about/sectionOfScope.ts';
import { addDays } from '../../src/lib/utils/addDays.ts';
import type { AboutSummary } from './AboutSummary.ts';
import type { AboutWeek } from './AboutWeek.ts';
import type { CommitAuthor } from './CommitAuthor.ts';
import type { CountedCommit } from './CountedCommit.ts';

interface ToAboutWeekParams {
  readonly week: string;
  /** This week's counted commits, newest first. */
  readonly commits: ReadonlyArray<CountedCommit>;
  readonly authors: ReadonlyMap<string, CommitAuthor>;
  readonly summary: AboutSummary | null;
  readonly final: boolean;
  readonly now: Date;
}

const tally = <T>(items: ReadonlyArray<T>) =>
  items.reduce((counts, item) => counts.set(item, (counts.get(item) ?? 0) + 1), new Map<T, number>());

const bySectionOrder = (a: AboutSection, b: AboutSection) => aboutSections.indexOf(a) - aboutSections.indexOf(b);

/** A week's KV record built from its commits. Sections and authors are sorted by how many commits they have. */
export function toAboutWeek({ week, commits, authors, summary, final, now }: ToAboutWeekParams): AboutWeek {
  const ofType = (type: CountedCommit['type']) => commits.filter((commit) => commit.type === type).length;
  const authorOf = (commit: CountedCommit) => authors.get(commit.email) ?? null;

  const sections = [...tally(commits.map(({ scope }) => sectionOfScope(scope)))]
    .sort(([a, countA], [b, countB]) => countB - countA || bySectionOrder(a, b))
    .map(([name, count]) => ({ name, count }));

  const byLogin = new Map([...authors.values()].map((author) => [author.login, author]));
  const people = [...tally(commits.flatMap((commit) => authorOf(commit)?.login ?? []))]
    .sort(([, a], [, b]) => b - a)
    .flatMap(([login]) => byLogin.get(login) ?? []);

  return {
    week,
    from: week,
    to: addDays(week, 6),
    counts: { new: ofType('feat'), fixed: ofType('fix'), faster: ofType('perf') },
    sections,
    authors: people.map(({ login, avatar }) => ({ login, avatar })),
    commits: commits.map((commit) => ({
      sha: commit.sha.slice(0, 7),
      type: commit.type,
      scope: commit.scope,
      subject: commit.subject,
      author: authorOf(commit)?.login ?? null,
    })),
    summary,
    lastCommit: commits.at(0)?.sha.slice(0, 7) ?? '',
    updatedAt: now.toISOString(),
    final,
  };
}
