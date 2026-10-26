import { z } from 'zod/v4';

const country = z.object({
  code: z.string(),
  name: z.string(),
  share: z.number(),
  watching: z
    .object({
      shows: z.number(),
      top: z.object({
        type: z.enum(['shows', 'movies']),
        title: z.string(),
        year: z.number().optional(),
        href: z.string(),
      }),
    })
    .optional(),
});

/** `HomeLive` as the shared cache keeps it, read back from JSON. */
export const homeLiveSchema = z.object({ shows: z.number(), movies: z.number(), countries: z.array(country) });
