import { AnalyticsEvent } from '../analytics/AnalyticsEvent.ts';
import { useTrack } from '../analytics/useTrack.ts';
import { type SettingsRequest, saveSettings } from '../settings/saveSettings.ts';

type ChangeHideSpecialsParams = {
  /** The toggle's new state. */
  hide: boolean;
  /** Shows a state on the page: the new one right away, the old one again if the save fails. */
  apply: (hide: boolean) => void;
  request: SettingsRequest;
  notify: { error: (message: string) => void };
};

const { track: trackSettings } = useTrack(AnalyticsEvent.Settings);

/**
 * The calendar sidebar's Specials choice: saves the viewer's own `browsing.calendar.hide_specials` through
 * `PUT /users/settings`, the setting every calendar and the dashboard schedule read. The page shows the new state
 * before the save and goes back to the old one, with the error, if it fails. Resolves whether it saved.
 */
export async function changeHideSpecials({ hide, apply, request, notify }: ChangeHideSpecialsParams): Promise<boolean> {
  apply(hide);
  const result = await saveSettings({ request, body: { browsing: { calendar: { hide_specials: hide } } } });
  if (result.saved) {
    trackSettings({ settings: 'calendar_specials' });
    return true;
  }

  apply(!hide);
  result.errors.forEach((message) => notify.error(message));
  return false;
}
