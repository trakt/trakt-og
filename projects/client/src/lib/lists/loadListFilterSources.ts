import { api } from '../api/api.ts';
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
  const response = await api({ fetch }).watchnow.sources.country({ params: { countryCode: country } }).catch(() =>
    null
  );
  if (!response || response.status < 200 || response.status >= 300) return new Map<string, FilterSource>();
  try {
    return toFilterSources(response.body, country);
  } catch {
    return new Map<string, FilterSource>();
  }
}
