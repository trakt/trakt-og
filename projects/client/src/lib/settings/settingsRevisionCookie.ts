/**
 * Names the viewer's last settings write in this browser. `markSettingsChanged` writes it after og saves a setting,
 * and the root layout keys its kept copy of the settings by it, so the next load reads them fresh.
 */
export const SETTINGS_REVISION_COOKIE = 'og-settings';
