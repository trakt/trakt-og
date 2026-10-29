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
};

const ENDED = new Set(['ended', 'canceled']);

const HIDES: Record<ProgressHide, (item: ProgressItem) => boolean> = {
  completed: ({ aired, completed }) => aired > 0 && completed >= aired,
  'not-completed': ({ aired, completed }) => completed < aired,
  ended: ({ show }) => ENDED.has(show.status ?? ''),
  airing: ({ show }) => show.status === 'returning series',
  rewatching: ({ resetAt }) => Boolean(resetAt),
};

/** The HIDE toggles, Include Watchlisted, the title search and the list filter, applied in the browser. */
export function filterProgress(
  items: readonly ProgressItem[],
  { hide, terms, listed, hideUnstarted }: FilterProgressParams,
): readonly ProgressItem[] {
  const needle = terms?.trim().toLocaleLowerCase();
  return items.filter(
    (item) =>
      !hide.some((id) => HIDES[id](item)) &&
      !(hideUnstarted && item.plays === 0) &&
      (!needle || item.show.title.toLocaleLowerCase().includes(needle)) &&
      (!listed || listed.has(item.show.id)),
  );
}
