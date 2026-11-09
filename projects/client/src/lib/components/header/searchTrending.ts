import { z } from 'zod/v4';
import { api } from '../../api/api.ts';
import { searchRowsSchema } from '../../search/searchRowsSchema.ts';
import type { DateOrder } from '../../utils/formatDate.ts';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { peopleThisMonthSchema } from './peopleThisMonthSchema.ts';
import type { searchTypes } from './searchTypes.ts';
import { toBirthdayRows } from './toBirthdayRows.ts';
import type { SearchTrendingSection } from './SearchTrendingSection.ts';
import { toSearchRow } from './toSearchRow.ts';

type SearchTrendingParams = {
  type: (typeof searchTypes)[number];
  /** The viewer's date, `YYYY-MM-DD`, and date order, for People's birthdays and ages. */
  today: string;
  order?: DateOrder;
  fetch?: typeof fetch;
  signal?: AbortSignal;
};

/** The dropdown's sections before anything is typed. Lists has two, side by side; the other types one, or none. */
export type SearchTrending = { readonly sections: readonly SearchTrendingSection[] };

// The API keeps what's searched most for shows and movies only: "people" comes back as shows, and a combined type as
// just its first. Shows & Movies asks for both and merges them by search count, like v3.
const KINDS: Readonly<Record<string, readonly ('movies' | 'shows')[]>> = {
  '': ['movies', 'shows'],
  shows: ['shows'],
  movies: ['movies'],
};
const SHOWN = 5;

// A failed list throws, so the dropdown tries again next time instead of keeping an empty one.
const failed = () => {
  throw new Error('The search dropdown list did not load.');
};

const searchCountsSchema = z.array(z.object({ count: z.number() }));

async function mostSearchedOf(
  fetch: typeof globalThis.fetch | undefined,
  kind: 'movies' | 'shows',
  signal?: AbortSignal,
) {
  const response = await rawApiFetch({
    fetch,
    path: `/search/recent_by_id/global/${kind}?limit=${SHOWN}&extended=full`,
    init: { signal },
  });
  if (!response.ok) return failed();
  const body = await response.json().catch(() => null);
  const hits = searchRowsSchema.safeParse(body);
  const counts = searchCountsSchema.safeParse(body);
  if (!hits.success || !counts.success) return failed();
  return hits.data.map((hit, index) => ({ hit, count: counts.data.at(index)?.count ?? 0 }));
}

async function mostSearched(
  fetch: typeof globalThis.fetch | undefined,
  kinds: readonly ('movies' | 'shows')[],
  signal?: AbortSignal,
) {
  const found = await Promise.all(kinds.map((kind) => mostSearchedOf(fetch, kind, signal)));

  return found
    .flat()
    .toSorted((a, b) => b.count - a.count)
    .map(({ hit }) => (hit.type === 'movie' || hit.type === 'show' ? toSearchRow(hit) : null))
    .filter((row) => row !== null)
    .slice(0, SHOWN);
}

// Lists show the most popular personal and official lists side by side, each with a link to browse them all on the
// search page.
const LIST_SECTIONS = [
  { type: 'personal', label: 'Popular Lists', more: { href: '/search/lists?type=personal', label: 'popular lists' } },
  {
    type: 'official',
    label: 'Popular Official Lists',
    more: { href: '/search/lists?type=official', label: 'official lists' },
  },
] as const;

async function popularLists(client: ReturnType<typeof api>, type: 'personal' | 'official', signal?: AbortSignal) {
  const response = await client.lists.popularByType({
    params: { type },
    query: { limit: SHOWN, extended: 'full' },
    fetchOptions: { signal },
  });
  if (response.status !== 200) return failed();
  return response.body.map(({ list }) => toSearchRow({ type: 'list', list })).filter((row) => row !== null);
}

// A section that fails is left out, so the other takes the width; only both failing asks again next time.
async function listSections(client: ReturnType<typeof api>, signal?: AbortSignal) {
  const settled = await Promise.allSettled(LIST_SECTIONS.map(({ type }) => popularLists(client, type, signal)));
  const sections = LIST_SECTIONS.flatMap(({ label, more }, index) => {
    const found = settled.at(index);
    return found?.status === 'fulfilled' && found.value.length > 0 ? [{ label, more, rows: found.value }] : [];
  });
  return sections.length > 0 ? sections : failed();
}

// The API keeps no trending people, so People shows this month's birthdays, like v3's search.
async function birthdays({ fetch, signal, today, order }: Omit<SearchTrendingParams, 'type'>) {
  const response = await rawApiFetch({ fetch, path: '/people/this_month?extended=full', init: { signal } });
  if (response.status !== 200) return failed();
  const people = peopleThisMonthSchema.safeParse(await response.json().catch(() => null));
  return people.success ? toBirthdayRows(people.data, today, order) : failed();
}

/**
 * What the header dropdown lists for a type before anything is typed: the most searched shows and movies, the popular
 * personal and official lists, or this month's birthdays for People. The other types have nothing.
 */
export async function searchTrending({
  type,
  today,
  order,
  fetch,
  signal,
}: SearchTrendingParams): Promise<SearchTrending> {
  const client = api({ fetch });
  const kinds = KINDS[type.slug];
  if (kinds) return { sections: [{ label: 'Most Searched', rows: await mostSearched(fetch, kinds, signal) }] };
  if (type.slug === 'lists') return { sections: await listSections(client, signal) };
  if (type.slug === 'people') {
    return { sections: [{ label: 'Birthdays This Month', rows: await birthdays({ fetch, signal, today, order }) }] };
  }
  return { sections: [] };
}
