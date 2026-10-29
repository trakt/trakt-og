import { rawApiFetch } from '../api/rawApiFetch.ts';
import { isRefusedWhenFresh } from '../auth/authenticatedFetch.ts';
import { localSettings } from './localSettings.ts';
import { markSettingsChanged } from './markSettingsChanged.ts';
import type { SettingsRequest } from './saveSettings.ts';

let noted = false;

function noteKept() {
  if (noted) return;
  noted = true;
  console.info("Only Trakt's own apps may save settings, so og keeps them in this browser.");
}

/**
 * The settings writes as JSON through `rawApiFetch`: `@trakt/api` has no contract for `/users/email`, and its
 * settings body lacks the username, the account keys and `display_dob`. In the browser, `fetch` is the
 * authenticated one, which renews a spent token and retries once. A write that succeeds calls `changed`, so the
 * root layout reads the settings fresh. The API lets only Trakt's own apps save settings, and refuses any other client
 * ID with a 401 even on a fresh token. Then a display setting stays in this browser instead (`localSettings`), says so
 * once in the console and counts as saved, so a fork's toggles still work.
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
    if (path === '/users/settings' && isRefusedWhenFresh(response) && localSettings.keeps(body)) {
      localSettings.save(body);
      noteKept();
      changed();
      return new Response(null, { status: 204 });
    }
    if (response.ok) changed();
    return response;
  };
}
