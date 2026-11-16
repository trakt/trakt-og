import { z } from 'zod/v4';

/** `/shows/:id/seasons/:n?extended=full`: the fields the Quality chart reads from each episode. */
export const qualityEpisodesSchema = z.array(
  z.object({
    season: z.number().int().nonnegative().nullish(),
    number: z.number().int().positive(),
    title: z.string().nullish(),
    ids: z.object({ trakt: z.number().int() }),
    rating: z.number().nullish(),
    votes: z.number().int().nonnegative().nullish(),
    first_aired: z.string().nullish(),
  }),
);
