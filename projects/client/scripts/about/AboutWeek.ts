import type { z } from 'zod/v4';
import type { aboutWeekSchema } from '../../src/lib/about/aboutWeekSchema.ts';

/** One `week:<Monday>` record in the `ABOUT` KV namespace. */
export type AboutWeek = z.infer<typeof aboutWeekSchema>;
