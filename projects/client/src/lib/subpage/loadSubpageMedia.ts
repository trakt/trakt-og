import { error, redirect } from '@sveltejs/kit';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { loadWatchNow } from '../components/watchnow/loadWatchNow.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import type { SubpageItem } from './SubpageItem.ts';
import { subpageApiPath } from './subpageApiPath.ts';
import { readSubpageItem } from './readSubpageItem.ts';
import { readSubpageRatings } from './readSubpageRatings.ts';
import { subpageParents } from './subpageParents.ts';
import { toSubpageStrip } from './toSubpageStrip.ts';
import { toSubpageMedia } from './toSubpageMedia.ts';
import { watchNowCountry } from '../settings/watchNowCountry.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  parent: () => Promise<{ datePreferences: DatePreferences; settings: ViewerSettings | null; user: HeaderUser | null }>;
  item: SubpageItem;
  /** The subpage's own path segment: `credits`, `stats`, `lists`, `comments`. */
  suffix: string;
  /** Stats has no sibling arrows and needs no neighbour reads. */
  neighbours?: boolean;
  /** Stats reads the ratings and counts too, for its strip and sections; other subpages go without the strip. */
  ratings?: boolean;
};

type Link = { readonly href: string; readonly label: string };

/** Watch Now's paths by the requested item, as `subpageWatchNowPath` gives them by its canonical one. */
function requestedWatchNowPath(item: SubpageItem): { readonly path: string; readonly fallback?: string } {
  const path = subpageApiPath(item);
  if (item.type === 'show') return { path, fallback: `${path}/seasons/1/episodes/1` };
  if (item.type === 'season') return { path, fallback: `${path}/episodes/1` };
  return { path };
}

const requestedHref = (item: SubpageItem) => {
  if (item.type === 'movie') return `/movies/${item.id}`;
  if (item.type === 'show') return `/shows/${item.id}`;
  if (item.type === 'season') return `/shows/${item.id}/seasons/${item.season}`;
  return `/shows/${item.id}/seasons/${item.season}/episodes/${item.episode}`;
};

/**
 * The slim header and sidebar every item subpage shares: the item, the previous and next arrows pointing at the sibling's
 * same subpage, and Watch Now. A non-canonical URL redirects to the slug's. Every read is public, so none sends the
 * viewer's token. Run it beside the subpage's own reads.
 */
export async function loadSubpageMedia({ fetch, parent, item, suffix, neighbours = true, ratings = false }: Params) {
  const layoutRead = parent();
  // Watch Now goes by the requested item once the layout has the viewer's country, alongside the item's reads, not
  // after them. A non-canonical URL redirects and drops it; the catch only stops a failed item read leaving it
  // unhandled.
  const watchNowRead = layoutRead.then(({ settings }) =>
    loadWatchNow({
      fetch,
      ...requestedWatchNowPath(item),
      country: watchNowCountry(settings),
      settings,
    }),
  );
  watchNowRead.catch(() => {});
  const [read, layout, reads] = await Promise.all([
    readSubpageItem({ fetch, item, neighbours }),
    layoutRead,
    ratings ? readSubpageRatings(fetch, item) : null,
  ]);
  const { user, settings, datePreferences } = layout;
  const watchNow = await watchNowRead;
  const collection = 'collection' in read ? read.collection : undefined;
  const media = toSubpageMedia({ body: read.body, justwatch: watchNow.rank?.link, collection });
  if (!media) error(404, 'Not found');
  if (media.href !== requestedHref(item)) redirect(301, `${media.href}/${suffix}`);

  const sibling = (link: Link | undefined) => link && { ...link, href: `${link.href}/${suffix}` };
  const strip = reads
    ? toSubpageStrip({
        media,
        reads,
        rank: watchNow.rank,
        otherSiteRatings: settings?.browsing?.other_site_ratings ?? true,
        now: new Date(),
      })
    : undefined;
  return {
    /** The public ratings and counts behind the strip, for the stats page; null when they didn't load. */
    reads,
    strip,
    media: { ...media, parents: subpageParents({ type: media.item.type, parents: media.parents, suffix }) },
    previous: 'previous' in read ? sibling(read.previous) : undefined,
    next: 'next' in read ? sibling(read.next) : undefined,
    watchNow: watchNow.button,
    streamingRank: watchNow.rank,
    user,
    settings,
    datePreferences,
  };
}
