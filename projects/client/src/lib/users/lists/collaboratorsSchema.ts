// FIXME(zod-4): see noteRowsSchema.ts. og uses the zod @trakt/api depends on, through its `zod/v4` API.
import { z } from 'zod/v4';

/** `/lists/:id/collaborators`: the approved collaborators, oldest first. `@trakt/api` has no contract for it. */
export const collaboratorsSchema = z.array(
  z.object({
    username: z.string(),
    name: z.string().nullish(),
    ids: z.object({ slug: z.string().nullish() }),
    images: z.object({ avatar: z.object({ full: z.string().nullish() }).nullish() }).nullish(),
    vip: z.boolean().nullish(),
    vip_ep: z.boolean().nullish(),
    vip_og: z.boolean().nullish(),
    vip_years: z.number().nullish(),
    director: z.boolean().nullish(),
  }),
);
