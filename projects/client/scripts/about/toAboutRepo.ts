import type { z } from 'zod/v4';
import type { aboutRepoSchema } from '../../src/lib/about/aboutRepoSchema.ts';
import type { GithubIssue } from './GithubIssue.ts';

interface IssueSearch {
  readonly total: number;
  readonly items: ReadonlyArray<GithubIssue>;
}

interface ToAboutRepoParams {
  readonly stars: number;
  /** Open issues, newest first. */
  readonly open: IssueSearch;
  /** Closed issues, any order. */
  readonly closed: IssueSearch;
  readonly commits: number;
  readonly now: Date;
}

const OPEN_SHOWN = 7;
const CLOSED_SHOWN = 6;

const issuesOnly = (items: ReadonlyArray<GithubIssue>) => items.filter((item) => item.pull_request === undefined);

const toIssue = (issue: GithubIssue, at: string) => ({
  number: issue.number,
  title: issue.title,
  label: issue.labels.at(0)?.name ?? null,
  at,
});

/** The `repo` KV record: the 7 newest open issues and the 6 most recently closed, pull requests left out. */
export function toAboutRepo({ stars, open, closed, commits, now }: ToAboutRepoParams): z.infer<typeof aboutRepoSchema> {
  const recentlyClosed = issuesOnly(closed.items)
    .flatMap((issue) => issue.closed_at ? [{ issue, at: issue.closed_at }] : [])
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, CLOSED_SHOWN);

  return {
    stars,
    openIssues: open.total,
    closedIssues: closed.total,
    commits,
    open: issuesOnly(open.items).slice(0, OPEN_SHOWN).map((issue) => toIssue(issue, issue.created_at)),
    closed: recentlyClosed.map(({ issue, at }) => toIssue(issue, at)),
    updatedAt: now.toISOString(),
  };
}
