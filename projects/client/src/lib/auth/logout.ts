import { AnalyticsEvent } from '../analytics/AnalyticsEvent.ts';
import { useTrack } from '../analytics/useTrack.ts';
import { overlay } from '../overlay/overlay.ts';
import { localSettings } from '../settings/localSettings.ts';
import { storeToken } from './storeToken.ts';
import { userManager } from './userManager.ts';

const { track: trackLogout } = useTrack(AnalyticsEvent.Logout);
let tracked = false;

/**
 * Clears the SSR cookie and any settings kept in this browser, revokes the tokens and deletes the cached overlay,
 * then ends the session at auth.trakt.tv, which returns to `/`.
 */
export async function logout(): Promise<void> {
  // The sign-out screen retries this after a failure; that's still the one sign out.
  if (!tracked) trackLogout();
  tracked = true;

  const manager = userManager();
  localSettings.clear();

  // Best-effort: a failed revoke or cookie clear must not strand the user signed in at the provider.
  await Promise.allSettled([storeToken(null), manager.revokeTokens(), overlay.stop()]);
  await manager.signoutRedirect();
}
