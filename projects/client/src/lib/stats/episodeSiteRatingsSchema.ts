import { z } from 'zod/v4';

const siteSchema = z
  .object({ rating: z.number().nullish(), votes: z.number().int().nonnegative().nullish() })
  .nullish();

/** An episode's `/ratings?extended=all`: the IMDb and TMDB ratings, 0 to 10, which `@trakt/api` has no contract for. */
export const episodeSiteRatingsSchema = z.object({ imdb: siteSchema, tmdb: siteSchema });
