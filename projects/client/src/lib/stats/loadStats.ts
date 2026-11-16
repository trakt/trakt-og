import { error } from '@sveltejs/kit';
import { loadSubpageMedia } from '../subpage/loadSubpageMedia.ts';
import { readQuality } from './readQuality.ts';
import { toMediaStats } from './toMediaStats.ts';
import { toQualityChart } from './toQualityChart.ts';

type Params = Omit<Parameters<typeof loadSubpageMedia>[0], 'suffix' | 'neighbours' | 'ratings'>;

/**
 * The shared subpage media, reading the public ratings and stats for the strip and the sections; the page needs
 * them, so a failed read is an error here. Viewer writes stay in MediaRating. A show's seasons or a season's episodes
 * are read beside them for the Quality chart, which is just absent when that read fails.
 */
export async function loadStats({ fetch, parent, item }: Params) {
  // By the requested item, so it starts with the rest; it never rejects, so a redirect that drops it leaves nothing.
  const qualityRead = readQuality({ fetch, item });
  // A season's or an episode's stats step to its siblings' with the header arrows and the arrow keys.
  const neighbours = item.type === 'season' || item.type === 'episode';
  const subpage = await loadSubpageMedia({ fetch, parent, item, suffix: 'stats', neighbours, ratings: true });
  if (!subpage.reads) error(502, 'The Trakt API could not load the ratings and stats.');
  const now = new Date();
  const stats = toMediaStats({
    media: subpage.media,
    ...subpage.reads,
    rank: subpage.streamingRank,
    otherSiteRatings: subpage.settings?.browsing?.other_site_ratings ?? true,
    now,
  });
  const read = await qualityRead;
  return {
    ...subpage,
    stats,
    quality:
      read &&
      toQualityChart({ read, href: subpage.media.href, reference: item.type === 'season' ? stats : undefined, now }),
  };
}
