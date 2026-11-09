import { z } from 'zod/v4';

const ids = z.object({ trakt: z.number(), slug: z.string().nullish() });

const role = z.enum(['directing', 'making', 'acting']);

const title = z.object({
  title: z.string(),
  ids,
});

/**
 * One of a Smart pick's `people`: someone behind several titles the viewer watched, how (`watched_roles`), in how
 * many (`watched_count`), and a few of those titles.
 */
export const recommendationPersonSchema = z.object({
  person: z.object({
    name: z.string(),
    ids,
  }),
  role,
  watched_roles: z.array(role).catch([]),
  watched_count: z.number(),
  titles: z.array(z.object({ show: title.optional(), movie: title.optional() })),
});
