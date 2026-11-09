import { mediaImage } from '../images/mediaImage.ts';
import type { ListItemRow } from './listItemRowsSchema.ts';

/**
 * The profile cover on a VIP owner's list: the first ranked item's fanart, with a
 * season or episode using its show's (the API gives seasons and episodes no fanart of their own). People have none.
 */
export function listCoverOf(row: ListItemRow | undefined): string | undefined {
  if (!row || row.type === 'person') return undefined;
  const { type, id } =
    row.type === 'movie'
      ? { type: 'movie' as const, id: row.movie.ids.trakt }
      : { type: 'show' as const, id: row.show.ids.trakt };
  return mediaImage({ type, id, slot: 'fanart', size: 'full' });
}
