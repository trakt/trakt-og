import type { TraktApiOptions } from '@trakt/api';

/** How the live refresher reads the API: og's client ID and base URL, which only og's own build knows. */
export type LiveConfig = { readonly apiKey: string; readonly environment: TraktApiOptions['environment'] };

const KEY = 'x-og-live-key';
const BASE = 'x-og-live-api';

const isBase = (value: string): value is `https://${string}` | `http://localhost:${string}` =>
  value.startsWith('https://') || value.startsWith('http://localhost:');

/**
 * The live refresher is bundled outside Vite, so it can't read the build's client ID or API setting. og's worker hands
 * them over on the headers of each socket it passes on; the refresher isn't reachable from outside, so nothing else
 * can set them.
 */
export const liveConfig = {
  write(headers: Headers, { apiKey, environment }: LiveConfig): void {
    headers.set(KEY, apiKey);
    headers.set(BASE, environment);
  },
  read(headers: Headers): LiveConfig | null {
    const apiKey = headers.get(KEY);
    const environment = headers.get(BASE);
    if (!apiKey || !environment || !isBase(environment)) return null;
    return { apiKey, environment };
  },
};
