import { api } from '../../api/api.ts';
import type { PickerList } from './PickerList.ts';

const LIMIT = 250;

/**
 * The viewer's own lists and the ones they collaborate on, in two requests: both routes already carry each list's
 * privacy and owner. Own lists come in the owner's rank order; collaborations have no rank and sort by title.
 */
export async function loadListCatalog(fetch: typeof globalThis.fetch): Promise<PickerList[]> {
  const client = api({ fetch });
  const page = (n: number) => client.users.lists.personal({ params: { id: 'me' }, query: { page: n, limit: LIMIT } });
  const [first, collaborations] = await Promise.all([
    page(1),
    client.users.lists.collaborations({ params: { id: 'me' }, query: {} }),
  ]);
  if (first.status !== 200 || collaborations.status !== 200) throw new Error('Lists unavailable');

  const pageCount = Number(first.headers.get('x-pagination-page-count')) || 1;
  const rest = await Promise.all(Array.from({ length: pageCount - 1 }, (_, i) => page(i + 2)));
  if (rest.some((response) => response.status !== 200)) throw new Error('Lists unavailable');
  const own = [first, ...rest].flatMap((response) => (response.status === 200 ? response.body : []));

  return [
    ...own.map((list, i) => ({
      id: list.ids.trakt,
      name: list.name,
      count: list.item_count,
      privacy: list.privacy,
      rank: i + 1,
      owner: list.user.ids.slug ?? 'me',
      collaboration: false,
      selected: false,
    })),
    ...collaborations.body.map((list) => ({
      id: list.ids.trakt,
      name: list.name,
      count: list.item_count,
      privacy: list.privacy,
      rank: 0,
      owner: list.user.ids.slug ?? String(list.user.ids.trakt),
      collaboration: true,
      selected: false,
    })),
  ];
}
