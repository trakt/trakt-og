import { z } from 'zod/v4';

const ids = z.object({ ids: z.object({ trakt: z.number() }) });

/**
 * `/people/:id/known_for`: the person's top-billed roles, plus movies they directed and shows they created. `@trakt/api`
 * has no contract for it yet, so it goes through `rawApiFetch`. Only the ids are kept; the credits already carry the rest.
 */
export const knownForSchema = z.array(
  z.object({
    type: z.enum(['movie', 'show']),
    movie: ids.nullish(),
    show: ids.nullish(),
  }),
);

export type KnownForItem = z.infer<typeof knownForSchema>[number];
