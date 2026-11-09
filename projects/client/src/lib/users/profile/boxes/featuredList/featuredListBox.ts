import { countLabel } from '../../../../utils/countLabel.ts';
import { mediaImage } from '../../../../images/mediaImage.ts';
import { boxMath } from '../boxMath.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import FeaturedListBox from './FeaturedListBox.svelte';
import type { FeaturedListView } from './FeaturedListView.ts';

type WatchlistMedia = {
  readonly type: 'movie' | 'show';
  readonly ids: { readonly trakt: number };
  readonly title: string;
};

/**
 * The watchlist, with its size, a stack of the first three posters and their titles. It tops out at 50 on purpose: a
 * good filler, rarely a headliner.
 */
export const featuredListBox = defineProfileBox({
  key: 'featured-list',
  group: 'image',
  floor: true,
  component: FeaturedListBox,
  score: ({ watchlist }) => (watchlist.count > 0 ? 100 * (0.2 + 0.3 * boxMath.cap(watchlist.count, 50)) : null),
  view: ({ profile, watchlist }): FeaturedListView => {
    const rows = watchlist.count > 0 ? watchlist.rows.slice(0, 3) : [];
    const media = rows.flatMap((row): WatchlistMedia[] => {
      if (row.movie) return [{ type: 'movie', ...row.movie }];
      return row.show ? [{ type: 'show', ...row.show }] : [];
    });
    const [first] = media;
    const art = (slot: 'poster' | 'fanart', { type, ids }: WatchlistMedia) =>
      mediaImage({ type, id: ids.trakt, slot, size: 'thumb' });
    return {
      name: 'Watchlist',
      href: `/users/${profile.slug}/watchlist`,
      count: watchlist.count > 0 ? countLabel(watchlist.count, 'item') : null,
      image: first ? art('fanart', first) : undefined,
      posters: media.map((item) => art('poster', item)),
      next: media.length > 0 ? `Next up: ${media.map(({ title }) => title).join(', ')}` : null,
    };
  },
});
