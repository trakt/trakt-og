import { z } from 'zod/v4';

/**
 * A movie's Letterboxd rating, 0 to 5, from `/movies/:id/ratings?extended=all`. The contract has it, but `@trakt/api`
 * doesn't export the movie ratings schema, so it's read from the raw body here.
 */
export const letterboxdSchema = z.object({
  letterboxd: z
    .object({
      rating: z.number().nonnegative().nullish(),
      link: z.string().nullish(),
      votes: z.number().int().nonnegative().nullish(),
    })
    .nullish(),
});
