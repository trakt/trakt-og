import { error } from '@sveltejs/kit';
import { loadSubpageMedia } from '../subpage/loadSubpageMedia.ts';
import { toMediaStats } from './toMediaStats.ts';

type Params = Omit<Parameters<typeof loadSubpageMedia>[0], 'suffix' | 'neighbours' | 'ratings'>;

/**
 * The shared subpage media, reading the public ratings and stats for the strip and the sections; the page needs
 * them, so a failed read is an error here. Viewer writes stay in MediaRating.
 */
export async function loadStats({ fetch, parent, item }: Params) {
  const subpage = await loadSubpageMedia({ fetch, parent, item, suffix: 'stats', neighbours: false, ratings: true });
  if (!subpage.reads) error(502, 'The Trakt API could not load the ratings and stats.');
  return {
    ...subpage,
    stats: toMediaStats({
      media: subpage.media,
      ...subpage.reads,
      rank: subpage.streamingRank,
      otherSiteRatings: subpage.settings?.browsing?.other_site_ratings ?? true,
      now: new Date(),
    }),
  };
}
