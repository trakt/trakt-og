import type { OverlayState, SeasonOf } from '../../overlay/createOverlay.svelte.ts';
import type { WatchTarget } from '../history/WatchTarget.ts';
import type { RatingTarget } from '../rating/RatingTarget.ts';
import { type QuickIconFill, quickIconFill } from './quickIconFill.ts';

type MediaQuickIconsItem = {
  readonly type: RatingTarget['type'];
  readonly id: number;
  readonly title: string;
  /** Out by now. Unreleased items get no rating or watch-now icon. */
  readonly released: boolean;
  readonly rating?: number;
  readonly airedEpisodes?: number;
  /** Minutes, so the watched tooltip can total the plays. */
  readonly runtime?: number;
  /** An episode's show and season, which its watched state is keyed by. */
  readonly season?: SeasonOf;
};

type MediaQuickIconsParams = {
  item: MediaQuickIconsItem;
  state: OverlayState;
  datePreferences?: Parameters<typeof quickIconFill>[0]['datePreferences'];
};

type MediaQuickIcons = {
  fill: QuickIconFill;
  ratingTarget: RatingTarget;
  watchTarget: WatchTarget;
  rating?: number;
  watchNow?: 'play';
};

/** The quick icons of a show, movie or episode card on the charts, search and discover. */
export function mediaQuickIcons({ item, state, datePreferences }: MediaQuickIconsParams): MediaQuickIcons {
  const { type, id, title, airedEpisodes, runtime, season } = item;
  return {
    fill: quickIconFill({ state, airedEpisodes, runtime, datePreferences }),
    ratingTarget: { type, id, title },
    watchTarget: { type, id, title, airedEpisodes, runtime, season },
    rating: item.released ? item.rating : undefined,
    // ponytail: OG showed watch now only with sources in the user's country. Until #60 brings sources, an item that
    // isn't out yet is taken to have none.
    watchNow: item.released ? 'play' : undefined,
  };
}
