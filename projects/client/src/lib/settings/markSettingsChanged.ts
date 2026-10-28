import { SETTINGS_REVISION_COOKIE } from './settingsRevisionCookie.ts';

// Outlives the layout's kept copy many times over, so a key without this cookie never finds a copy from before it.
const MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Says og just saved one of the viewer's settings, so the root layout stops using its kept copy
 * (`keptSettingsFetch`). Call it once the save succeeds, before reloading the page's data.
 */
export function markSettingsChanged(page: Pick<Document, 'cookie'> = document, now = Date.now()) {
  page.cookie = `${SETTINGS_REVISION_COOKIE}=${now.toString(36)}; path=/; samesite=lax; max-age=${MAX_AGE_SECONDS}`;
}
