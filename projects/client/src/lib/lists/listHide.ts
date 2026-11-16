import type { FadeHideOption } from '../components/filters/fadeHide.ts';
import { iconShares } from '../components/media/quickIconFill.ts';
import type { OverlayState } from '../overlay/createOverlay.svelte.ts';
import type { OverlaySlices } from '../overlay/OverlaySlices.ts';
import { matchesListFade } from './matchesListFade.ts';
import type { ListItemCard } from './toListItemCard.ts';

/** The overlay slices the viewer hides read, as the menu names them when one fails to load. */
const SLICE_LABELS = {
  watchedMovies: 'watched history',
  watchedShows: 'watched history',
  collectedMovies: 'library',
  collectedShows: 'library',
  watchlist: 'watchlist',
  listMembership: 'lists',
  ratings: 'ratings',
} as const satisfies Partial<Record<keyof OverlaySlices, string>>;

const WATCHED = ['watchedMovies', 'watchedShows'] as const;
const LIBRARY = ['collectedMovies', 'collectedShows'] as const;

/** The overlay slices each viewer hide reads. */
const SLICES: Readonly<Record<FadeHideOption, readonly (keyof typeof SLICE_LABELS)[]>> = {
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

/**
 * The viewer hides that can't apply, each with why: a slice they read failed to load and has no cached copy. They
 * come back on their own once a later check fetches it.
 */
export function unavailableHides({
  slices,
  failed,
}: {
  slices: Partial<OverlaySlices>;
  failed: readonly (keyof OverlaySlices)[];
}): ReadonlyMap<string, string> {
  return new Map(
    Object.entries(SLICES).flatMap(([option, names]) => {
      const missing = names.find((name) => failed.includes(name) && slices[name] === undefined);
      return missing ? [[option, `Couldn't load your ${SLICE_LABELS[missing]}`] as const] : [];
    }),
  );
}

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
