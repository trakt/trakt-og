import { z } from 'zod/v4';
import { rawApiFetch } from '../../api/rawApiFetch.ts';

const savedFiltersSchema = z.array(
  z.object({
    name: z.string(),
    path: z.string(),
    query: z
      .string()
      .nullish()
      .transform((query) => query ?? ''),
  }),
);

// Calendars and search filters can't become smart lists, so only the charts' sections are read.
const SECTIONS = ['shows', 'movies'] as const;

type Params = { fetch: typeof globalThis.fetch; token: string };

/**
 * The viewer's classic Trakt saved filters on the Shows and Movies charts, which smart lists replace. Empty when there
 * are none or they didn't load: the offer to bring them back just doesn't show.
 */
export async function fetchSavedFilters({ fetch, token }: Params) {
  const sections = await Promise.all(
    SECTIONS.map(async (section) => {
      const response = await rawApiFetch({ fetch, token, path: `/users/saved_filters/${section}` }).catch(() => null);
      if (!response?.ok) return [];
      const parsed = savedFiltersSchema.safeParse(await response.json().catch(() => null));
      return parsed.success ? parsed.data : [];
    }),
  );
  return sections.flat();
}
