import type { AboutIssueRow } from '../AboutIssueRow.ts';
import { githubCommitsSchema } from './githubCommitsSchema.ts';
import { githubIssueSearchSchema } from './githubIssueSearchSchema.ts';
import { githubRepoSchema } from './githubRepoSchema.ts';
import { type AboutCommit, toAboutCommit } from './toAboutCommit.ts';
import type { z } from 'zod/v4';

const API = 'https://api.github.com';
const REPO = 'trakt/trakt-og';
/** GitHub refuses a request without one, and a Worker's fetch doesn't send one of its own. */
const USER_AGENT = 'og.trakt.tv';
const OPEN = 10;
const CLOSED = 10;
const COMMITS = 50;
/** GitHub can't sort search results by close date, so this many recently updated closed issues are read and sorted. */
const CLOSED_POOL = 30;

type Issue = AboutIssueRow;
type SearchItem = z.infer<typeof githubIssueSearchSchema>['items'][number];

/** The repo on GitHub as the about page shows it: counts, the open and closed issues and the latest commits. */
export type AboutGithub = {
  readonly stars: number;
  /** Null in a cached copy from before forks were read. */
  readonly forks: number | null;
  readonly open: { readonly total: number; readonly issues: readonly Issue[] };
  readonly closed: { readonly total: number; readonly issues: readonly Issue[] };
  readonly commits: readonly AboutCommit[];
  /** Every commit on main. Null in a cached copy from before it was counted. */
  readonly commitCount: number | null;
};

interface FetchAboutGithubParams {
  fetch: typeof globalThis.fetch;
  /** A read-only GitHub token, the `GITHUB_TOKEN` Worker secret: 5,000 reads an hour instead of 60 per address. */
  token?: string;
}

const toIssue =
  (at: (item: SearchItem) => string) =>
  (item: SearchItem): Issue => ({
    number: item.number,
    title: item.title,
    label: item.labels.at(0)?.name ?? null,
    at: at(item),
  });

async function get({ fetch, token }: FetchAboutGithubParams, path: string): Promise<Response> {
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': USER_AGENT,
    ...(token && { authorization: `Bearer ${token}` }),
  };
  const response = await fetch(`${API}${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${path}`);
  return response;
}

/** A GitHub JSON response parsed with a schema. A failure, a rate limit or a shape it doesn't expect throws. */
async function read<T>(params: FetchAboutGithubParams, path: string, schema: z.ZodType<T>): Promise<T> {
  return schema.parse(await (await get(params, path)).json());
}

/**
 * Every commit on main, without paging through them: at one commit a page, the `Link` header's last page is the
 * count. A repo with a single commit has no last page.
 */
async function countCommits(params: FetchAboutGithubParams): Promise<number> {
  const response = await get(params, `/repos/${REPO}/commits?sha=main&per_page=1`);
  const last = response.headers.get('link')?.match(/[?&]page=(\d+)>; rel="last"/)?.[1];
  return last ? Number(last) : githubCommitsSchema.parse(await response.json()).length;
}

const search = (query: string, sort: string, perPage: number) =>
  `/search/issues?q=${encodeURIComponent(
    `repo:${REPO} is:issue ${query}`,
  )}&sort=${sort}&order=desc&per_page=${perPage}`;

/**
 * The repo's stars, its newest open issues and latest closed ones with their totals, the latest commits on main and
 * how many there are in all.
 * It's all or nothing: any part failing throws, so the cache keeps its last good copy instead of a half-empty one.
 */
export async function fetchAboutGithub(params: FetchAboutGithubParams): Promise<AboutGithub> {
  const [repo, open, closed, commits, commitCount] = await Promise.all([
    read(params, `/repos/${REPO}`, githubRepoSchema),
    read(params, search('is:open', 'created', OPEN), githubIssueSearchSchema),
    read(params, search('is:closed', 'updated', CLOSED_POOL), githubIssueSearchSchema),
    read(params, `/repos/${REPO}/commits?sha=main&per_page=${COMMITS}`, githubCommitsSchema),
    countCommits(params),
  ]);

  return {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    open: { total: open.total_count, issues: open.items.map(toIssue((item) => item.created_at)) },
    closed: {
      total: closed.total_count,
      issues: closed.items
        .map(toIssue((item) => item.closed_at ?? item.created_at))
        .toSorted((a, b) => b.at.localeCompare(a.at))
        .slice(0, CLOSED),
    },
    commits: commits.map(toAboutCommit),
    commitCount,
  };
}
