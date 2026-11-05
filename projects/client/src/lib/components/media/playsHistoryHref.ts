import type { RatingTarget } from '../rating/RatingTarget.ts';

/** The viewer's own plays of a title, which a watched tooltip's play count links to. */
export const playsHistoryHref = (
  viewer: string | undefined,
  target: Pick<RatingTarget, 'type' | 'id'> | undefined,
): string | undefined =>
  viewer && target ? `/users/${encodeURIComponent(viewer)}/history?${target.type}=${target.id}` : undefined;
