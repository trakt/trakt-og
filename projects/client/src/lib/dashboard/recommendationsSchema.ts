import { z } from 'zod/v4';
import { recommendationSourceSchema } from './recommendationSourceSchema.ts';

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
  colors: z.object({ poster: z.array(z.string()).nullish() }).nullish(),
});

/** One row of `/media/recommendations`, `/shows/recommendations` or `/movies/recommendations`: the title and why. */
const row = z.object({
  show: media.optional(),
  movie: media.optional(),
  score: z.coerce.number().nullish(),
  sources: z.array(recommendationSourceSchema).nullish(),
});

/**
 * The recommendations v3 shows, which @trakt/api 0.6.0 has no contract for. Classic picks carry their `sources`;
 * Smart picks come with none, and `fetchRecommendationReasons` loads them for one pick.
 */
export const recommendationsSchema = z.array(row);
