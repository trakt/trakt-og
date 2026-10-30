import { z } from 'zod/v4';

const extraRatingSchema = z
  .object({
    rating: z.number().nonnegative().nullish(),
    link: z.string().nullish(),
    votes: z.number().int().nonnegative().nullish(),
  })
  .nullish();

/**
 * The ratings `/:type/:id/ratings?extended=all` has beyond `@trakt/api`'s shared schema, read from the raw body: a
 * movie's Letterboxd rating, 0 to 5, and an anime's MyAnimeList rating, 0 to 10.
 */
export const extraRatingsSchema = z.object({ letterboxd: extraRatingSchema, mal: extraRatingSchema });

export type ExtraRating = NonNullable<z.infer<typeof extraRatingSchema>>;
