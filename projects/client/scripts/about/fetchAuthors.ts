import { z } from 'zod/v4';
import { uniqueBy } from '../../src/lib/utils/uniqueBy.ts';
import type { CommitAuthor } from './CommitAuthor.ts';
import type { CountedCommit } from './CountedCommit.ts';
import { githubJson } from './githubJson.ts';

interface FetchAuthorsParams {
  readonly repo: string;
  readonly token?: string;
  readonly commits: ReadonlyArray<CountedCommit>;
}

const commitSchema = z.object({
  author: z.object({ login: z.string(), avatar_url: z.url() }).nullable(),
});

/**
 * The GitHub account behind each commit email, looked up once per email from one of its commits. Emails without an
 * account, or whose lookup fails, are left out, so their commits show no author.
 */
export async function fetchAuthors({ repo, token, commits }: FetchAuthorsParams): Promise<Map<string, CommitAuthor>> {
  const lookups = await Promise.allSettled(
    uniqueBy(commits, ({ email }) => email).map(async ({ email, sha }) => {
      const { author } = commitSchema.parse(await githubJson({ path: `/repos/${repo}/commits/${sha}`, token }));
      return author ? [[email, { login: author.login, avatar: author.avatar_url }] as const] : [];
    }),
  );
  return new Map(lookups.flatMap((lookup) => lookup.status === 'fulfilled' ? lookup.value : []));
}
