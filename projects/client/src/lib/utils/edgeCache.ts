import type { ResponseCache } from '../settings/keptSettingsFetch.ts';

/** The data center's cache. Undefined where there is none (tests, a runtime outside Cloudflare). */
export function edgeCache(): ResponseCache | undefined {
  return typeof caches === 'undefined' ? undefined : caches.default;
}
