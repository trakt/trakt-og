import { analytics } from './analytics.ts';
import type { AnalyticsEventDataMap } from './AnalyticsEventDataMap.ts';

// trakt-web's signature, so a call site ports as-is. Unlike web's it works
// outside component setup too, in a click handler or a plain module.
export function useTrack<T extends keyof AnalyticsEventDataMap>(key: T) {
  function track<D extends AnalyticsEventDataMap[T]>(...args: [D] extends [never] ? [] | [D?] : [D]) {
    analytics.record(key, args[0] ?? {});
  }

  return { track };
}
