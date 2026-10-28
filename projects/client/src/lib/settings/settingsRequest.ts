import { rawApiFetch } from '../api/rawApiFetch.ts';
import { markSettingsChanged } from './markSettingsChanged.ts';
import type { SettingsRequest } from './saveSettings.ts';

/**
 * The settings writes as JSON through `rawApiFetch`: `@trakt/api` has no contract for `/users/email`, and its
 * settings body lacks the username, the account keys and `display_dob`. In the browser, `fetch` is the
 * authenticated one, which renews a spent token and retries once. A write that succeeds calls `changed`, so the
 * root layout reads the settings fresh.
 */
export function settingsRequest(
  fetch: typeof globalThis.fetch,
  changed: () => void = markSettingsChanged,
): SettingsRequest {
  return async (path, method, body) => {
    const response = await rawApiFetch({
      fetch,
      path,
      init: { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    });
    if (response.ok) changed();
    return response;
  };
}
