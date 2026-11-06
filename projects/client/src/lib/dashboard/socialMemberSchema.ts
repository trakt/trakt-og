import { z } from 'zod/v4';

/** The member fields a Social Feed row or a live watch reads. `name` is the display name, blank when they never set one. */
export const socialMemberSchema = z.object({
  username: z.string(),
  name: z.string().nullish(),
  deleted: z.boolean().nullish(),
  ids: z.object({ slug: z.string().nullish() }),
  images: z.object({ avatar: z.object({ full: z.string().nullish() }) }).nullish(),
});
