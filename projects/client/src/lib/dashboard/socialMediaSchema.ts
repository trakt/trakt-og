import { z } from 'zod/v4';
import { episode, images, movie, show } from '../users/history/historyRowsSchema.ts';

/**
 * What a Social Feed row or a member's watching is about, from `extended=full,images`. Watches are movies and episodes;
 * ratings and comments can be on any of the four.
 */
export const socialMediaSchema = z.union([
  z.object({ type: z.literal('movie'), movie }),
  z.object({ type: z.literal('show'), show }),
  z.object({ type: z.literal('season'), show, season: z.object({ number: z.number(), images }) }),
  z.object({ type: z.literal('episode'), show, episode }),
]);

export type SocialMedia = z.infer<typeof socialMediaSchema>;
