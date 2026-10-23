import { z } from 'zod/v4';

const issue = z.object({
  number: z.number().int(),
  title: z.string(),
  label: z.string().nullable(),
  at: z.string(),
});

/**
 * The repo's GitHub numbers as the summaries workflow keeps them in the `ABOUT` KV namespace under `repo`: stars,
 * issue counts (pull requests left out), all-time commits on main, the newest open issues and the latest closed ones.
 */
export const aboutRepoSchema = z.object({
  stars: z.number().int(),
  openIssues: z.number().int(),
  closedIssues: z.number().int(),
  commits: z.number().int(),
  open: z.array(issue),
  closed: z.array(issue),
  updatedAt: z.string(),
});
