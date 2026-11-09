import { z } from 'zod/v4';

const media = z.object({
  ids: z.object({ trakt: z.number(), slug: z.string() }),
  title: z.string(),
  year: z.number().nullish(),
  runtime: z.number().nullish(),
  rating: z.number().nullish(),
  aired_episodes: z.number().nullish(),
});

const row = { plays: z.number(), last_watched_at: z.string() };

/** Only with `extended=progress`: the episodes watched, season by season. */
const seasons = z
  .array(z.object({ number: z.number(), episodes: z.array(z.object({ number: z.number(), plays: z.number() })) }))
  .nullish();

/**
 * `/users/:id/watched/{shows,movies}?extended=full`, the shows with `reset_at` (a rewatch's start) and, with
 * `extended=progress`, their `seasons`. `@trakt/api` 0.6.0 types the movies route without a query, so
 * og can't page it through the typed client, and reads both lists raw.
 */
export const watchedItemsSchema = z.array(
  z.union([
    z.object({ ...row, show: media, reset_at: z.string().nullish(), seasons }),
    z.object({ ...row, movie: media }),
  ]),
);

export type WatchedItemRow = z.infer<typeof watchedItemsSchema>[number];
