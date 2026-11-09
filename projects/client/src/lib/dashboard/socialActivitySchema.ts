import { z } from 'zod/v4';
import { socialMediaSchema } from './socialMediaSchema.ts';
import { socialMemberSchema } from './socialMemberSchema.ts';

const base = z.object({ id: z.number(), activity_at: z.string(), user: socialMemberSchema });

// A watch's `method` is `scrobble`, `checkin` or `watch` (added by hand). It stays a string, so a new one keeps the row.
const action = z.discriminatedUnion('action', [
  z.object({ action: z.literal('watch'), method: z.string().nullish() }),
  z.object({ action: z.literal('rating'), rating: z.number().int().min(1).max(10) }),
  z.object({
    action: z.literal('comment'),
    comment: z.object({
      id: z.number(),
      comment: z.string(),
      spoiler: z.boolean(),
      review: z.boolean(),
      likes: z.number(),
      replies: z.number(),
    }),
  }),
]);

/**
 * One row of `/v3/users/me/following/activities?extended=full`: a followed member's watch, rating or top-level
 * comment. `@trakt/api` has no contract for the v3 feed, so each row is parsed here.
 */
export const socialActivitySchema = z.intersection(base, z.intersection(socialMediaSchema, action));

export type SocialActivity = z.infer<typeof socialActivitySchema>;
