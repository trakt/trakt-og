import { z } from 'zod/v4';
import { aboutRepoSchema } from '../../src/lib/about/aboutRepoSchema.ts';
import { git } from './git.ts';
import { githubJson } from './githubJson.ts';
import { searchIssues } from './searchIssues.ts';
import { toAboutRepo } from './toAboutRepo.ts';

interface FetchAboutRepoParams {
  readonly repo: string;
  readonly token?: string;
  /** The ref whose commits are counted, normally `origin/main`. */
  readonly ref: string;
  readonly now: Date;
}

const repoSchema = z.object({ stargazers_count: z.number().int() });

// Closed issues can't be searched by close date, so read a page by last update and sort it by when each closed.
const CLOSED_PAGE = 30;

/** The `repo` KV record, from the GitHub API and the commit count on main. */
export async function fetchAboutRepo({ repo, token, ref, now }: FetchAboutRepoParams) {
  const [details, open, closed, commits] = await Promise.all([
    githubJson({ path: `/repos/${repo}`, token }).then((body) => repoSchema.parse(body)),
    searchIssues({ query: `repo:${repo} is:issue is:open`, sort: 'created', perPage: 7, token }),
    searchIssues({ query: `repo:${repo} is:issue is:closed`, sort: 'updated', perPage: CLOSED_PAGE, token }),
    git(['rev-list', '--count', ref]).then((count) => Number.parseInt(count.trim(), 10)),
  ]);
  return aboutRepoSchema.parse(toAboutRepo({ stars: details.stargazers_count, open, closed, commits, now }));
}
