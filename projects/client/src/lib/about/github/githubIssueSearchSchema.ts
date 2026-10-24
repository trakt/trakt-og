import { z } from 'zod/v4';

/** The fields of GitHub's `GET /search/issues` the about page reads: the total, and each issue's first label. */
export const githubIssueSearchSchema = z.object({
  total_count: z.number().int(),
  items: z.array(
    z.object({
      number: z.number().int(),
      title: z.string(),
      labels: z.array(z.object({ name: z.string() })),
      created_at: z.string(),
      closed_at: z.string().nullable(),
    }),
  ),
});
