import comments from '$lib/icons/solid/comments.svg?raw';
import star from '$lib/icons/solid/star.svg?raw';
import collection from '$lib/icons/trakt/collection-thick.svg?raw';
import friends from '$lib/icons/trakt/friends-thick.svg?raw';
import list from '$lib/icons/trakt/list-thick.svg?raw';
import play from '$lib/icons/trakt/play2-thick.svg?raw';
import type { StripStatKind } from './stripStats.ts';

/** Each community count's icon, as raw SVG: the ratings strip's and the stats page's Community tiles'. */
export const stripStatIcons: Readonly<Record<StripStatKind, string>> = {
  watchers: friends,
  plays: play,
  libraries: collection,
  lists: list,
  comments,
  favorited: star,
};
