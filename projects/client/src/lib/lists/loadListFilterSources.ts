import { rawApiFetch } from '../api/rawApiFetch.ts';
import { type FilterSource, toFilterSources } from '../components/filters/watchNowFilter.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import { watchNowCountry } from '../settings/watchNowCountry.ts';

/** Applied streaming chips only need a source read when the URL has a streaming filter. Failure leaves the list usable. */
export async function loadListFilterSources({ fetch, watchnow, settings }: {
  fetch: typeof globalThis.fetch;
  watchnow?: string;
  settings?: ViewerSettings | null;
}) {
  if (!watchnow) return new Map<string, FilterSource>();
  const country = watchNowCountry(settings);
  const response = await rawApiFetch({ fetch, path: `/watchnow/sources/${country}` }).catch(() => null);
  if (!response?.ok) return new Map<string, FilterSource>();
  try {
    return toFilterSources(await response.json(), country);
  } catch {
    return new Map<string, FilterSource>();
  }
}
