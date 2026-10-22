// zod 4 API from the zod 3 package @trakt/api depends on: see the FIXME in `../notes/noteRowsSchema.ts`.
import { z } from 'zod/v4';

import { profileResponseSchema } from '../profileResponseSchema.ts';

/**
 * `/users/:id/following` and `/followers` rows carry `followed_at`, and the API `/users/requests/following`
 * rows carry `id` and `requested_at` instead. The page reads the user, their VIP veteran title and the follow date.
 * The typed contract has no `page` or `limit` on these routes, so they're fetched raw and parsed here.
 */
export const networkRowsSchema = z.array(z.object({
  user: profileResponseSchema.extend({ vip_veteran_title: z.string().nullish() }),
  followed_at: z.string().nullish(),
}));
