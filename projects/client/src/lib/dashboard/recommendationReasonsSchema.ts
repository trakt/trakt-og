import { z } from 'zod/v4';
import { recommendationPersonSchema } from './recommendationPersonSchema.ts';
import { recommendationSourceSchema } from './recommendationSourceSchema.ts';

/**
 * `/v3/recommendations/:type/:id/reasons`: why one Smart pick was made. A `people` shape it can't read leaves them
 * out rather than the titles too.
 */
export const recommendationReasonsSchema = z.object({
  sources: z.array(recommendationSourceSchema),
  people: z.array(recommendationPersonSchema).nullish().catch(null),
});
