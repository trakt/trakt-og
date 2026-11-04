import { z } from 'zod/v4';

/** `GET /v3/users/:id/match`: the score, its two parts, and what the viewer and the owner share. */
export const userMatchSchema = z.object({
  score: z.number(),
  breakdown: z.object({ subgenres: z.number(), favorites: z.number() }),
  shared: z.object({
    subgenres: z.array(z.object({ name: z.string(), slug: z.string(), rarity: z.number().nullish() })),
    favorites: z.object({ movies: z.array(z.number()), shows: z.array(z.number()) }),
  }),
});
