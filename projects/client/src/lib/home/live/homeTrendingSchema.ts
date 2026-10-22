import { z } from 'zod/v4';

const title = z.object({
  key: z.string(),
  type: z.enum(['shows', 'movies']),
  slug: z.string(),
  title: z.string(),
  year: z.number().optional(),
  href: z.string(),
  poster: z.string().optional(),
});

/** `HomeTrending` as the shared cache keeps it, read back from JSON. */
export const homeTrendingSchema = z.object({ shows: z.array(title), movies: z.array(title) });
