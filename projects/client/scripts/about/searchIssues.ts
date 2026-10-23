import { z } from 'zod/v4';
import type { GithubIssue } from './GithubIssue.ts';
import { githubJson } from './githubJson.ts';

interface SearchIssuesParams {
  readonly query: string;
  readonly sort: 'created' | 'updated';
  readonly perPage: number;
  readonly token?: string;
}

const searchSchema = z.object({
  total_count: z.number().int(),
  items: z.array(z.object({
    number: z.number().int(),
    title: z.string(),
    labels: z.array(z.object({ name: z.string() })),
    created_at: z.string(),
    closed_at: z.string().nullable(),
    pull_request: z.unknown().optional(),
  })),
});

/** One page of a GitHub issue search, newest first by `sort`, with the total match count. */
export async function searchIssues(
  { query, sort, perPage, token }: SearchIssuesParams,
): Promise<{ total: number; items: ReadonlyArray<GithubIssue> }> {
  const params = new URLSearchParams({ q: query, sort, order: 'desc', per_page: String(perPage) });
  const { total_count, items } = searchSchema.parse(await githubJson({ path: `/search/issues?${params}`, token }));
  return { total: total_count, items };
}
