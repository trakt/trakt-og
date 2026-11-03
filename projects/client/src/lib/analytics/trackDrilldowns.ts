import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { AnalyticsEvent } from './AnalyticsEvent.ts';
import { toDrilldownTarget } from './toDrilldownTarget.ts';
import { toSearchResultPosition } from './toSearchResultPosition.ts';
import { useTrack } from './useTrack.ts';

type DrilldownTracking = {
  /** trakt-web's name for where the item was shown: `trending`, `watchlist`, `search`, ... */
  readonly source: string;
  /** Adds the result's position bucket, as trakt-web does for search results. */
  readonly positions?: boolean;
};

const { track: trackSummary } = useTrack(AnalyticsEvent.SummaryDrilldown);
const { track: trackList } = useTrack(AnalyticsEvent.Drilldown);

// Sections nest (a panel inside a page), so the innermost one counts a click and the rest let it pass.
const counted = new WeakSet<Event>();

const pathOf = (link: Element) => new URL(link.getAttribute('href') ?? '', 'https://og.trakt.tv').pathname;

// The position of the item among the section's items, each counted once however many links it has.
function positionOf(node: HTMLElement, link: Element) {
  const paths = [...node.querySelectorAll('a[href]')]
    .filter((other) => toDrilldownTarget(other.getAttribute('href') ?? ''))
    .map(pathOf);
  return toSearchResultPosition([...new Set(paths)].indexOf(pathOf(link)) + 1);
}

/**
 * trakt-web's card drilldowns for a section of items: a click on a link to an item's page sends
 * `action.summary-drilldown`, one to a list sends `action.drilldown`, both with the section's `source`. Web tracks
 * each card; og listens once per section, like web's review pages, so the cards stay as they are.
 */
export function trackDrilldowns({ source, positions = false }: DrilldownTracking): Attachment<HTMLElement> {
  return (node) =>
    on(node, 'click', (event) => {
      if (counted.has(event)) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || !node.contains(link)) return;

      const target = toDrilldownTarget(link.getAttribute('href') ?? '');
      if (!target) return;
      counted.add(event);

      const position = positions ? { position: positionOf(node, link) } : {};
      if (target.event === 'list') trackList({ source, type: 'list', ...position });
      else trackSummary({ source, type: target.type, ...position });
    });
}
