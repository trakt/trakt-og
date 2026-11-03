import { page } from '$app/state';
import type { Attachment } from 'svelte/attachments';
import { AnalyticsEvent } from './AnalyticsEvent.ts';
import { useTrack } from './useTrack.ts';

const SEEN_FOR_MS = 1000;
// A fully shown element can report a hair under 1.
const FULLY_VISIBLE = 0.99;

const { track } = useTrack(AnalyticsEvent.VipUpsellImpression);

/**
 * trakt-web's `action.vip-upsell-impression`: a VIP prompt stayed fully on screen for a second, shown to someone who
 * isn't VIP. Once per time the prompt appears.
 */
export function trackUpsellImpression(source: string): Attachment<HTMLElement> {
  return (node) => {
    if (typeof IntersectionObserver === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        clearTimeout(timer);
        const latest = entries.at(-1);
        if (!latest?.isIntersecting || latest.intersectionRatio < FULLY_VISIBLE) return;

        timer = setTimeout(() => {
          observer.disconnect();
          if (!page.data.user?.isVip) track({ source });
        }, SEEN_FOR_MS);
      },
      { threshold: FULLY_VISIBLE },
    );
    observer.observe(node);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  };
}
