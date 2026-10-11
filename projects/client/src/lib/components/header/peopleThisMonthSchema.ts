import { z } from 'zod/v4';

/**
 * `/people/this_month`: people with a birthday this month, which v3's search shows for People. `@trakt/api` has no
 * contract for it, so it's parsed here. Only the fields the search dropdown uses.
 */
export const peopleThisMonthSchema = z.array(z.object({
  name: z.string(),
  ids: z.object({ trakt: z.number(), slug: z.string() }),
  birthday: z.string().nullish(),
  death: z.string().nullish(),
  known_for_department: z.string().nullish(),
  images: z.object({ headshot: z.array(z.string()).nullish() }).nullish(),
}));
