import type { FadeHideOption } from '../components/filters/fadeHide.ts';
import { iconShares } from '../components/media/quickIconFill.ts';
import type { OverlayState } from '../overlay/createOverlay.svelte.ts';
import type { OverlaySlices } from '../overlay/OverlaySlices.ts';
import { matchesListFade } from './matchesListFade.ts';
import type { ListItemCard } from './toListItemCard.ts';

const WATCHED = ['watchedMovies', 'watchedShows'] as const;
const LIBRARY = ['collectedMovies', 'collectedShows'] as const;

/** The overlay slices each viewer hide reads. */
const SLICES: Readonly<Record<FadeHideOption, readonly (keyof OverlaySlices)[]>> = {
  watched: WATCHED,
  watching: WATCHED,
  unwatched: WATCHED,
  collected: LIBRARY,
  collecting: LIBRARY,
  uncollected: LIBRARY,
  watchlisted: ['watchlist'],
  unwatchlisted: ['watchlist'],
  listed: ['listMembership'],
  unlisted: ['listMembership'],
  rated: ['ratings'],
  unrated: ['ratings'],
};

const isViewerOption = (option: string): option is FadeHideOption => option in SLICES;

/** The overlay has loaded what the hides read. A signed-out visitor has no overlay, so their viewer hides don't apply. */
export function listHideReady({
  hide,
  slices,
  signedIn,
}: {
  hide: readonly string[];
  slices: Partial<OverlaySlices>;
  signedIn: boolean;
}): boolean {
  if (!signedIn) return true;
  return hide.filter(isViewerOption).every((option) => SLICES[option].every((name) => slices[name] !== undefined));
}

/**
 * The release and airing hides, as the API applied them: to movies and shows only. Undefined for any other option.
 */
function releaseHidden(option: string, release: ListItemCard['release'], now: Date): boolean | undefined {
  const at = release?.at;
  const out = !!at && new Date(at) <= now;
  switch (option) {
    case 'released':
      return Boolean(release) && out;
    case 'unreleased':
      return Boolean(release) && !out;
    case 'noreleasedate':
      return Boolean(release) && !at;
    case 'ended':
      return ['ended', 'canceled'].includes(release?.status ?? '');
    case 'airing':
      return release?.status === 'returning series';
    default:
      return undefined;
  }
}

/** Whether any of the hides drops the card: its release facts, its notes, or the viewer's overlay state. */
export function listCardHidden({
  card,
  hide,
  state,
  signedIn,
  now,
}: {
  card: ListItemCard;
  hide: readonly string[];
  state: OverlayState;
  signedIn: boolean;
  now: Date;
}): boolean {
  const fill = iconShares({ state, airedEpisodes: card.airedEpisodes });
  return hide.some(
    (option) =>
      releaseHidden(option, card.release, now) ??
      ((signedIn || !isViewerOption(option)) && matchesListFade({ option, notes: card.notes, state, fill })),
  );
}
