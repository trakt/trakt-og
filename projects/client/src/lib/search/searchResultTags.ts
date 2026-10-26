import { mediaTags } from '../components/labels/mediaTags.ts';
import type { TagPill } from '../components/labels/TagPill.ts';
import type { SearchCard } from './SearchCard.ts';

/**
 * A search result's tag pills under its title, like the header search and the summary header: a movie's or show's
 * type when the tab mixes them, then its certificate, runtime or episodes, two genres and network, with the year left to the title. An
 * episode or a person keeps its card tags, the type in red and the rest outlined.
 */
export function searchResultTags(card: SearchCard): TagPill[] {
  if (card.type === 'movie' || card.type === 'show') {
    return mediaTags({
      type: card.type,
      mixed: card.tags.some((tag) => tag.kind === undefined),
      certification: card.certification,
      runtime: card.type === 'movie' ? card.runtime : undefined,
      airedEpisodes: card.airedEpisodes,
      genres: card.genres,
      network: card.network,
    });
  }
  return card.tags.map(({ text, kind }) => (kind === undefined ? { text, kind: 'primary' } : { text }));
}
