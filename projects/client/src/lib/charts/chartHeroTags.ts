import { mediaTags } from '../components/labels/mediaTags.ts';
import type { TagPill } from '../components/labels/TagPill.ts';
import type { ChartCard } from './toChartCard.ts';

/**
 * The podium hero's tag pills: the chart's own counts lead, the first in red ("11,688 watchers"), then the item's year,
 * certificate, length, genres and network, as on discover's hero. A count the details already show (anticipated's
 * network) isn't repeated. A show's runtime is per episode, so only its episode count shows.
 */
export function chartHeroTags(card: ChartCard): TagPill[] {
  const details = mediaTags({
    type: card.type,
    year: card.year,
    certification: card.certification,
    runtime: card.type === 'movie' ? card.runtime : undefined,
    airedEpisodes: card.airedEpisodes,
    genres: card.genres,
    network: card.network,
  });
  const shown = new Set(details.flatMap((tag) => ('segments' in tag ? tag.segments : [tag.text])));
  const counts = card.tags
    .filter(({ text }) => !shown.has(text))
    .map(({ text }, i): TagPill => (i === 0 ? { text, kind: 'primary' } : { text }));

  return [...counts, ...details];
}
