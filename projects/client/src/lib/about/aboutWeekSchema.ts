import { z } from 'zod/v4';
import { aboutSections } from './aboutSections.ts';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const section = z.enum(aboutSections);

/**
 * One week of changes as the summaries workflow keeps it in the `ABOUT` KV namespace under `week:<Monday>`. The
 * counts, sections, authors and commits come straight from the commit log on every run. `summary` is the written
 * part, refreshed at most every 4 hours, and null until the first one is written.
 */
export const aboutWeekSchema = z.object({
  week: day,
  from: day,
  to: day,
  counts: z.object({ new: z.number().int(), fixed: z.number().int(), faster: z.number().int() }),
  sections: z.array(z.object({ name: section, count: z.number().int() })),
  authors: z.array(z.object({ login: z.string(), avatar: z.url() })),
  commits: z.array(z.object({
    sha: z.string(),
    type: z.enum(['feat', 'fix', 'perf']),
    scope: z.string(),
    subject: z.string(),
    author: z.string().nullable(),
  })),
  summary: z.object({
    title: z.string().max(60),
    themes: z.array(z.object({ section, text: z.string().max(220) })).min(1).max(7),
    through: z.string(),
    at: z.string(),
  }).nullable(),
  lastCommit: z.string(),
  updatedAt: z.string(),
  final: z.boolean(),
});
