import { z } from 'zod/v4';

/** What a reorder answers: how many ranks it set, and the ids it couldn't find. */
export const reorderResultSchema = z.object({
  updated: z.number().int().nonnegative(),
  skipped_ids: z.array(z.number()),
});
