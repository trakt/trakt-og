import { z } from 'zod/v4';
import { aboutSections } from '../aboutSections.ts';

const issue = z.object({ number: z.number(), title: z.string(), label: z.string().nullable(), at: z.string() });
const issues = z.object({ total: z.number(), issues: z.array(issue) });

/** The about page's `AboutGithub` as the shared cache keeps it, read back from JSON. */
export const aboutGithubSchema = z.object({
  stars: z.number(),
  /** Missing from copies cached before forks were read. */
  forks: z.number().nullable().catch(null),
  open: issues,
  closed: issues,
  /** Missing from copies cached before the count existed. */
  commitCount: z.number().nullable().catch(null),
  commits: z.array(z.object({
    sha: z.string(),
    href: z.string(),
    day: z.string(),
    type: z.string().nullable(),
    section: z.enum(aboutSections),
    subject: z.string(),
    author: z.object({ login: z.string(), avatar: z.string() }).nullable(),
  })),
});
