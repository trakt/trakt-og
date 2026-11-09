import { z } from 'zod/v4';
import type { Franchise } from './Franchise.ts';
import { isFranchise } from './isFranchise.ts';

const row = z.object({
  like_count: z.number().nullish(),
  list: z.object({
    name: z.string(),
    ids: z.object({ trakt: z.number(), slug: z.string() }),
    item_ids: z.object({ movies: z.array(z.number()).nullish() }).nullish(),
  }),
});

/**
 * A page of `/lists/popular/official?extended=item_ids`, which `@trakt/api` doesn't type. Keeps only the franchises,
 * with their movie ids; a malformed row is skipped.
 */
export const franchisePageSchema = z.array(z.unknown()).transform((rows) =>
  rows.flatMap((value): Franchise[] => {
    const parsed = row.safeParse(value);
    if (!parsed.success) return [];
    const { name, ids, item_ids } = parsed.data.list;
    const franchise = {
      id: ids.trakt,
      slug: ids.slug,
      name,
      movieIds: [...new Set(item_ids?.movies ?? [])],
      likeCount: parsed.data.like_count ?? 0,
    };
    return isFranchise(franchise) ? [franchise] : [];
  }),
);
