import { z } from 'zod/v4';

/** The fields of GitHub's `GET /repos/{owner}/{repo}/commits` the about page reads. `author` is null for an email
 * GitHub can't match to an account. */
export const githubCommitsSchema = z.array(
  z.object({
    sha: z.string(),
    html_url: z.string(),
    commit: z.object({
      message: z.string(),
      committer: z.object({ date: z.string() }).nullable(),
    }),
    author: z.object({ login: z.string(), avatar_url: z.string() }).nullable(),
  }),
);
