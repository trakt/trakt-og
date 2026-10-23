import { z } from 'zod/v4';
import { githubJson } from './githubJson.ts';

interface FetchMergedPullTitlesParams {
  readonly repo: string;
  readonly token?: string;
  /** First and last `YYYY-MM-DD` day of the week. */
  readonly from: string;
  readonly to: string;
}

const searchSchema = z.object({ items: z.array(z.object({ title: z.string() })) });

/** Titles of the pull requests merged in a week, newest first. */
export async function fetchMergedPullTitles(
  { repo, token, from, to }: FetchMergedPullTitlesParams,
): Promise<ReadonlyArray<string>> {
  const params = new URLSearchParams({
    q: `repo:${repo} is:pr is:merged merged:${from}..${to}`,
    sort: 'updated',
    order: 'desc',
    per_page: '100',
  });
  const { items } = searchSchema.parse(await githubJson({ path: `/search/issues?${params}`, token }));
  return items.map(({ title }) => title);
}
