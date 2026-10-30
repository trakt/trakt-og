import { z } from 'zod/v4';

export const images = z
  .object({
    poster: z.array(z.string()).nullish(),
    fanart: z.array(z.string()).nullish(),
    screenshot: z.array(z.string()).nullish(),
  })
  .nullish();

export const movie = z.object({
  ids: z.object({ trakt: z.number(), slug: z.string() }),
  title: z.string(),
  year: z.number().nullish(),
  runtime: z.number().nullish(),
  rating: z.number().nullish(),
  votes: z.number().nullish(),
  /** A bare date. */
  released: z.string().nullish(),
  images,
});

export const show = movie.extend({
  first_aired: z.string().nullish(),
  aired_episodes: z.number().nullish(),
  genres: z.array(z.string()).nullish(),
});

export const episode = z.object({
  ids: z.object({ trakt: z.number() }),
  season: z.number(),
  number: z.number(),
  number_abs: z.number().nullish(),
  title: z.string().nullish(),
  episode_type: z.string().nullish(),
  runtime: z.number().nullish(),
  rating: z.number().nullish(),
  images,
});

const play = { id: z.number(), watched_at: z.string() };

/**
 * `/users/:id/history[/:type][/:item_id]?extended=full,images`. Read raw because `@trakt/api` 0.6.0 types `watchnow`
 * as a few keywords, while the worker takes service slugs too (`middleware/sources.ts`).
 */
export const historyRowsSchema = z.array(z.union([z.object({ ...play, movie }), z.object({ ...play, episode, show })]));

/** `/users/:id/watched/shows?extended=full,images`, the Shows tab's rows. */
export const watchedShowsSchema = z.array(z.object({ plays: z.number(), last_watched_at: z.string(), show }));

/** `/users/:id/watched/movies?extended=full,images`, the sorted Movies tab's rows. */
export const watchedMoviesSchema = z.array(z.object({ plays: z.number(), last_watched_at: z.string(), movie }));

export type HistoryRow = z.infer<typeof historyRowsSchema>[number];
export type WatchedShowRow = z.infer<typeof watchedShowsSchema>[number];
export type WatchedMovieRow = z.infer<typeof watchedMoviesSchema>[number];
