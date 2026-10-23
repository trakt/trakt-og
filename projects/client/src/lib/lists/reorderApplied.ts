import { z } from 'zod/v4';

const reorderResultSchema = z.object({ updated: z.number().int().nonnegative(), skipped_ids: z.array(z.number()) });

/**
 * Whether a reorder response kept the order sent: the API took every id, so none is in `skipped_ids`. `updated` counts
 * the rows the write touched, not which of them moved, so it can't say whether the order changed and isn't checked.
 * Throws on a body off the contract.
 */
export function reorderApplied(body: unknown): boolean {
  return reorderResultSchema.parse(body).skipped_ids.length === 0;
}
