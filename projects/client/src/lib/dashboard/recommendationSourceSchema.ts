import { z } from 'zod/v4';

const ids = z.object({ trakt: z.number(), slug: z.string().nullish() });

const sourceMedia = z.object({ title: z.string(), year: z.number().nullish(), ids });

/**
 * What led to a recommendation: a title the viewer watched (`activity`, with their rating as `stars`) or loved
 * (`favorite`), or the subgenres they like. The list rows and `/v3/recommendations/:type/:id/reasons` share it.
 */
export const recommendationSourceSchema = z.object({
  type: z.enum(['activity', 'favorite', 'subgenre']),
  stars: z.number().nullish(),
  show: sourceMedia.optional(),
  movie: sourceMedia.optional(),
  subgenres: z.array(z.object({ name: z.string(), slug: z.string() })).nullish(),
});
