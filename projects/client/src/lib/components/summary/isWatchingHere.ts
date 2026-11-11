import type { WatchingNow } from '#lib/users/WatchingNow.ts';

type Params = {
  watching: Pick<WatchingNow, 'item' | 'showId'> | null | undefined;
  /** The page's movie or episode. */
  item?: { readonly type: 'movie' | 'episode' | 'show' | 'season'; readonly id: number };
  /** A show's pages: any of its episodes counts. */
  show?: number;
};

/** Whether what the viewer is watching is this page's movie or episode, or an episode of this page's show. */
export function isWatchingHere({ watching, item, show }: Params): boolean {
  if (!watching) return false;
  if (show !== undefined) return watching.showId === show;
  return item?.type === watching.item.type && item.id === watching.item.id;
}
