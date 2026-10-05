import { countLabel } from '../../../../utils/countLabel.ts';
import { imageUrl } from '../../../../utils/imageUrl.ts';
import { boxMath } from '../boxMath.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import FeaturedListBox from './FeaturedListBox.svelte';
import type { FeaturedListView } from './FeaturedListView.ts';

/**
 * The watchlist, with its size, a stack of the first three posters and their titles. It tops out at 50 on purpose: a
 * good filler, rarely a headliner.
 */
export const featuredListBox = defineProfileBox({
  key: 'featured-list',
  group: 'image',
  floor: true,
  component: FeaturedListBox,
  score: ({ watchlist }) => watchlist.count > 0 ? 100 * (0.2 + 0.3 * boxMath.cap(watchlist.count, 50)) : null,
  view: ({ profile, watchlist }): FeaturedListView => {
    const media = watchlist.count > 0 ? watchlist.rows.slice(0, 3).flatMap((row) => row.movie ?? row.show ?? []) : [];
    return {
      name: 'Watchlist',
      href: `/users/${profile.slug}/watchlist`,
      count: watchlist.count > 0 ? countLabel(watchlist.count, 'item') : null,
      image: imageUrl(media.at(0)?.images?.fanart?.at(0), 'thumb'),
      posters: media.flatMap(({ images }) => imageUrl(images?.poster?.at(0), 'thumb') ?? []),
      next: media.length > 0 ? `Next up: ${media.map(({ title }) => title).join(', ')}` : null,
    };
  },
});
