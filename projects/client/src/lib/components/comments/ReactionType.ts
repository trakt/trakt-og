import type { z } from 'zod/v4';
import type { reactionTypeSchema } from './reactionTypeSchema.ts';

/** One of OG's seven comment reactions. */
export type ReactionType = z.infer<typeof reactionTypeSchema>;
