import { z } from 'zod/v4';

/**
 * A title's parental guide from `/v3/media/:type/:slug/info/16/version/1`: each category's severity. The category stays a
 * string, so one the API adds later is dropped by the mapper instead of failing the whole guide. The vote counts
 * (`signals`) aren't shown, so they aren't read.
 */
export const parentalGuideSchema = z.object({
  guide: z.array(
    z.object({
      category: z.string(),
      severity: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE']),
    }),
  ),
});
