import type { createOverlay } from '../overlay/createOverlay.svelte.ts';
import type { BuiltInListKind } from './toBuiltInListView.ts';
import type { ListItemCard } from './toListItemCard.ts';
import { writeOwnerList } from './writeOwnerList.ts';

/** Bulk removal patches membership once; both page cards and the shared overlay roll back on failure. */
export async function removeOwnerItems({ kind, items, overlay, request, notify }: {
  kind: BuiltInListKind;
  items: readonly Pick<ListItemCard, 'type' | 'id'>[];
  overlay: Pick<ReturnType<typeof createOverlay>, 'patch'>;
  request: (path: string, init: RequestInit) => Promise<Response>;
  notify: { error: (message: string) => void };
}) {
  const targets = items.flatMap((item) => item.type === 'person' ? [] : [{ type: item.type, id: item.id }]);
  const gone = new Set(targets.map((item) => `${item.type}:${item.id}`));
  const isGone = (type: string, id: number) => gone.has(`${type}:${id}`);
  const subtract = (ids: ReadonlySet<number> | undefined, type: string) =>
    new Set([...ids ?? []].filter((id) => !isGone(type, id)));
  const rollback = kind === 'watchlist'
    ? overlay.patch('watchlist', (data) => ({
      ...data,
      movie: subtract(data.movie, 'movie'),
      show: subtract(data.show, 'show'),
      season: subtract(data.season, 'season'),
      episode: subtract(data.episode, 'episode'),
    }), { movie: new Set(), show: new Set() })
    : overlay.patch('favorites', (data) => ({
      ...data,
      movie: subtract(data.movie, 'movie'),
      show: subtract(data.show, 'show'),
      dates: {
        movie: new Map([...data.dates?.movie ?? []].filter(([id]) => !isGone('movie', id))),
        show: new Map([...data.dates?.show ?? []].filter(([id]) => !isGone('show', id))),
      },
    }), { movie: new Set(), show: new Set() });
  const ok = await writeOwnerList({ kind, change: { type: 'remove', items: targets }, request, notify });
  if (!ok) rollback();
  return ok;
}
