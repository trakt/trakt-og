import { previewArt } from '../images/previewArt.ts';
import type { ListItemCard } from './toListItemCard.ts';

/** A list's link preview art: its first item's fanart, then poster, a season's or episode's from its show. */
export function listPreviewArt(card: Pick<ListItemCard, 'type' | 'id' | 'seasonOf'> | undefined): string | undefined {
  if (!card) return undefined;
  if (card.type === 'person') return previewArt({ type: 'person', id: card.id, slot: 'headshot' });

  const type = card.type === 'movie' ? 'movie' : 'show';
  const id = card.type === 'movie' || card.type === 'show' ? card.id : card.seasonOf?.show;
  if (id === undefined) return undefined;
  return previewArt({ type, id, slot: 'fanart' }, { type, id, slot: 'poster' });
}
