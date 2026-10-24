import { z } from 'zod/v4';

const images = z
  .object({
    poster: z.array(z.string()).nullish(),
    fanart: z.array(z.string()).nullish(),
  })
  .nullish();

const ids = z.object({ trakt: z.number(), slug: z.string().nullish() });

const media = z.object({
  title: z.string(),
  year: z.number().nullish(),
  ids,
  overview: z.string().nullish(),
  rating: z.number().nullish(),
  votes: z.number().nullish(),
  runtime: z.number().nullish(),
  certification: z.string().nullish(),
  genres: z.array(z.string()).nullish(),
  network: z.string().nullish(),
  aired_episodes: z.number().nullish(),
  first_aired: z.string().nullish(),
  released: z.string().nullish(),
  images,
  colors: z.object({ poster: z.array(z.string()).nullish() }).nullish(),
});

const sourceMedia = z.object({ title: z.string(), year: z.number().nullish(), ids, images });

const source = z.object({
  type: z.enum(['activity', 'favorite', 'subgenre']),
  stars: z.number().nullish(),
  show: sourceMedia.optional(),
  movie: sourceMedia.optional(),
  subgenres: z.array(z.object({ name: z.string(), slug: z.string() })).nullish(),
});

/** One row of `/media/recommendations`, `/shows/recommendations` or `/movies/recommendations`: the title and why. */
const row = z.object({
  show: media.optional(),
  movie: media.optional(),
  score: z.coerce.number().nullish(),
  sources: z.array(source).nullish(),
});

/**
 * The recommendations v3 shows, which @trakt/api 0.6.0 has no contract for. Each `sources` entry is what led to the
 * pick: a title the viewer watched (`activity`, with their rating as `stars`) or loved (`favorite`), or the
 * subgenres they like.
 */
export const recommendationsSchema = z.array(row);
