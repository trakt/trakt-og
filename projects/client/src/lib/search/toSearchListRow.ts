import { toListRow } from '../lists/toListRow.ts';
import type { SearchHit } from './SearchHit.ts';

/**
 * Maps a list hit onto OG's list row. Null for any other hit. Search only finds public lists, so the only chip is an
 * official list's, and a hit carries only poster paths, so each poster is titled with the list's name.
 */
export function toSearchListRow(hit: SearchHit) {
  const { list } = hit;
  if (hit.type !== 'list' || !list) return null;

  const row = toListRow(list);
  return {
    ...row,
    owner: { ...row.owner, avatar: list.user.images?.avatar?.full ?? undefined },
    posters: row.posters.map((poster) => ({ title: list.name, ...poster })),
  };
}
