import { z } from 'zod/v4';

/** `/shows/:id/seasons?extended=full`: the fields the Quality chart reads from each season. */
export const qualitySeasonsSchema = z.array(
  z.object({
    number: z.number().int().nonnegative(),
    ids: z.object({ trakt: z.number().int() }),
    rating: z.number().nullish(),
    votes: z.number().int().nonnegative().nullish(),
    episode_count: z.number().int().nonnegative().nullish(),
    aired_episodes: z.number().int().nonnegative().nullish(),
  }),
);
