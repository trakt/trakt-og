import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { AnalyticsEvent } from './AnalyticsEvent.ts';
import { useTrack } from './useTrack.ts';

type SectionDrilldown = {
  /** trakt-web's `ListTitle` id for the section: `credits`, `videos`, `watchlist`, ... */
  readonly source: string;
  /** The mode, where web sends one. */
  readonly type?: string;
};

const { track } = useTrack(AnalyticsEvent.Drilldown);

/**
 * trakt-web's section-title drilldown: a click on the element's link to the section's full page sends
 * `action.drilldown`. With `href`, only a link there counts; without, any link in the element does.
 */
export function trackSectionDrilldown(drilldown: SectionDrilldown, href?: string): Attachment<HTMLElement> {
  return (node) =>
    on(node, 'click', (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || !node.contains(link)) return;
      if (href === undefined || link.getAttribute('href') === href) track(drilldown);
    });
}
