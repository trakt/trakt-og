import { z } from 'zod/v4';
import { recommendationSourceSchema } from './recommendationSourceSchema.ts';

/** `/v3/recommendations/:type/:id/reasons`: why one Smart pick was made. Its `people` aren't shown yet. */
export const recommendationReasonsSchema = z.object({ sources: z.array(recommendationSourceSchema) });
