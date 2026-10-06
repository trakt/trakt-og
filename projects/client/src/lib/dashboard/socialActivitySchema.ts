import { z } from 'zod/v4';
import { socialMediaSchema } from './socialMediaSchema.ts';

// The member fields the Social Feed reads. `name` is the worker's display name, blank when they never set one.
const member = z.object({
  username: z.string(),
  name: z.string().nullish(),
  deleted: z.boolean().nullish(),
  ids: z.object({ slug: z.string().nullish() }),
  images: z.object({ avatar: z.object({ full: z.string().nullish() }) }).nullish(),
});

const base = z.object({ id: z.number(), activity_at: z.string(), user: member });

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
 * One row of `/v3/users/me/following/activities?extended=full,images`: a followed member's watch, rating or top-level
 * comment. `@trakt/api` has no contract for the v3 feed, so each row is parsed here.
 */
export const socialActivitySchema = z.intersection(base, z.intersection(socialMediaSchema, action));

export type SocialActivity = z.infer<typeof socialActivitySchema>;
