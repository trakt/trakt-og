import { fetchFirstNight } from '../../../lib/firstNight/firstNight.ts';

/** The welcome wall's real charts, streamed as the dashboard streams them. Public, so they go without the token. */
export function load() {
  return { firstNight: fetchFirstNight({ fetch: globalThis.fetch }) };
}
