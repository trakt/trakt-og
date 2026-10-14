// FIXME(zod-4): og has one zod, the one @trakt/api depends on. See `src/lib/users/notes/noteRowsSchema.ts`.
import { z } from 'zod/v4';
import type { GifCategory } from './GifCategory.ts';
import { klipyUrl } from './klipyUrl.ts';

const categoriesSchema = z.object({
  data: z.object({
    categories: z.array(z.object({ category: z.string(), query: z.string(), preview_url: z.string() })),
  }),
});

type FetchGifCategoriesParams = { customerId: string; fetch?: typeof fetch };

/** Klipy's GIF categories, for the picker's row of shortcuts. Empty when they can't be loaded. */
export async function fetchGifCategories(
  { customerId, fetch = globalThis.fetch }: FetchGifCategoriesParams,
): Promise<readonly GifCategory[]> {
  const response = await fetch(klipyUrl('gifs/categories', new URLSearchParams({ customer_id: customerId })))
    .catch(() => null);
  if (!response?.ok) return [];

  const parsed = categoriesSchema.safeParse(await response.json().catch(() => null));
  return parsed.success
    ? parsed.data.data.categories.map(({ category, query, preview_url }) => ({
      title: category,
      query,
      previewUrl: preview_url,
    }))
    : [];
}
