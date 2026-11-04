import type { OverlayState } from '../overlay/createOverlay.svelte.ts';
import type { OverlaySlices } from '../overlay/OverlaySlices.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { formatDate } from '../utils/formatDate.ts';
import type { ListSort } from './resolveListSort.ts';
import type { ListCardLine, ListItemCard } from './toListItemCard.ts';

/** Sorts the worker answers in rank order, so og orders the whole list in the browser from the viewer's overlay. */
const BROWSER_SORTS = ['watched', 'collected', 'plays'];

export const isBrowserSort = (by: string) => BROWSER_SORTS.includes(by);

/** What an item sorts by: undefined when it has none, as an unwatched or uncollected item. */
export function viewerSortValue(by: string, state: OverlayState): string | number | undefined {
  switch (by) {
    case 'watched':
      return state.lastWatchedAt;
    case 'collected':
      return state.collectedAt ?? state.lastCollectedAt;
    case 'plays':
      return state.watchedPlays || undefined;
    default:
      return undefined;
  }
}

/** The overlay has loaded the slices a browser sort reads. */
export function viewerSortReady(by: string, slices: Partial<OverlaySlices>): boolean {
  const needs: readonly (keyof OverlaySlices)[] =
    by === 'collected' ? ['collectedMovies', 'collectedShows'] : ['watchedMovies', 'watchedShows'];
  return needs.every((name) => slices[name] !== undefined);
}

/** Cards in a browser sort. Items without a value go last either way, and ties keep their rank order. */
export function sortCardsByViewer<T extends Pick<ListItemCard, 'rank'>>(
  cards: readonly T[],
  { how }: ListSort,
  valueOf: (card: T) => string | number | undefined,
): T[] {
  const flip = how === 'desc' ? -1 : 1;
  return cards
    .map((card) => ({ card, value: valueOf(card) }))
    .sort((a, b) => {
      if (a.value === undefined || b.value === undefined) {
        if (a.value !== b.value) return a.value === undefined ? 1 : -1;
      } else if (a.value !== b.value) {
        return (a.value < b.value ? -1 : 1) * flip;
      }
      return a.card.rank - b.card.rank;
    })
    .map(({ card }) => card);
}

const isUnknownDate = (at: string) => at.startsWith('1970-01-01');
const dateLine = (at: string | undefined, datePreferences: DatePreferences) =>
  at && (isUnknownDate(at) ? 'Unknown date' : formatDate(at, { ...datePreferences, time: true }));

/** The line under the title for a sort about the viewer, from their overlay state. My Rating has its own RatingLine. */
export function viewerSortLine(by: string, state: OverlayState, datePreferences: DatePreferences): string | undefined {
  switch (by) {
    case 'watched':
      return dateLine(state.lastWatchedAt, datePreferences);
    case 'collected':
      return dateLine(state.collectedAt ?? state.lastCollectedAt, datePreferences);
    case 'plays':
      return state.watchedPlays ? `${state.watchedPlays} ${state.watchedPlays === 1 ? 'play' : 'plays'}` : undefined;
    default:
      return undefined;
  }
}

type LinedCard = Pick<ListItemCard, 'type' | 'href' | 'lines'>;
const underShow = ({ type }: LinedCard) => type === 'season' || type === 'episode';

/** The card's lines with `text` in the sorted line: second under a season's or episode's show, else first. */
export function withViewerLine(card: LinedCard, text: string): ListItemCard['lines'] {
  const line: ListCardLine = { text, href: card.href };
  return underShow(card) ? [card.lines[0], line] : [line, card.lines[1]];
}

/** The card's lines before a RatingLine takes the sorted line's place: a season's or episode's show, else none. */
export const linesBeforeRating = (card: LinedCard): readonly ListCardLine[] => (underShow(card) ? [card.lines[0]] : []);
