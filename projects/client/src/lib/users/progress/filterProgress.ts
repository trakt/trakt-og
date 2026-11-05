import type { ProgressHide } from './progressHide.ts';
import type { ProgressItem } from './ProgressItem.ts';

type FilterProgressParams = {
  hide: readonly ProgressHide[];
  /** The title search. */
  terms?: string;
  /** `?list=`: only shows on that list. */
  listed?: ReadonlySet<number>;
  /**
   * Include Watchlisted off: drop the shows you haven't played yet. The endpoint lists your watchlisted shows beside
   * the ones you've started, and those are the only unstarted ones it lists.
   */
  hideUnstarted?: boolean;
  /**
   * Shows already on screen in this view (`keepOnScreen`). The HIDE toggles pass them, so a show you complete stays put
   * with its show card, to rate it, until the view changes or the page reloads.
   */
  onScreen?: ReadonlyMap<number, boolean>;
};

const ENDED = new Set(['ended', 'canceled']);

const isCompleted = ({ aired, completed }: ProgressItem) => aired > 0 && completed >= aired;

const HIDES: Record<ProgressHide, (item: ProgressItem) => boolean> = {
  completed: isCompleted,
  'not-completed': ({ aired, completed }) => completed < aired,
  // Long runners followed from the newest episode on: back once a newer one airs and the endpoint refiles them.
  'latest-watched': (item) => Boolean(item.latestWatched) || isCompleted(item),
  ended: ({ show }) => ENDED.has(show.status ?? ''),
  airing: ({ show }) => show.status === 'returning series',
  rewatching: ({ resetAt }) => Boolean(resetAt),
};

const isHidden = (item: ProgressItem, hide: readonly ProgressHide[]) => hide.some((id) => HIDES[id](item));

/**
 * The shows on screen, for `filterProgress`'s `onScreen`: each with whether its counts were settled, exact or already
 * kept past a HIDE toggle. A show whose counts were only guessed isn't kept once they turn exact: guessed, a show with
 * hidden seasons looks unfinished, and its exact counts show it was completed all along.
 */
export function keepOnScreen(
  shown: readonly ProgressItem[],
  hide: readonly ProgressHide[],
): ReadonlyMap<number, boolean> {
  return new Map(shown.map((item) => [item.show.id, item.exact || isHidden(item, hide)]));
}

const isKept = (item: ProgressItem, onScreen: ReadonlyMap<number, boolean> | undefined) =>
  onScreen?.has(item.show.id) === true && (onScreen.get(item.show.id) === true || !item.exact);

/** The HIDE toggles, Include Watchlisted, the title search and the list filter, applied in the browser. */
export function filterProgress(
  items: readonly ProgressItem[],
  { hide, terms, listed, hideUnstarted, onScreen }: FilterProgressParams,
): readonly ProgressItem[] {
  const needle = terms?.trim().toLocaleLowerCase();
  return items.filter(
    (item) =>
      (isKept(item, onScreen) || !isHidden(item, hide)) &&
      !(hideUnstarted && item.plays === 0) &&
      (!needle || item.show.title.toLocaleLowerCase().includes(needle)) &&
      (!listed || listed.has(item.show.id)),
  );
}
