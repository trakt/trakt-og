import { overlay } from '../overlay/overlay.ts';
import { localSettings } from '../settings/localSettings.ts';
import { storeToken } from './storeToken.ts';
import { userManager } from './userManager.ts';

/**
 * Clears the SSR cookie and any settings kept in this browser, revokes the tokens and deletes the cached overlay,
 * then ends the session at auth.trakt.tv, which returns to `/`.
 */
export async function logout(): Promise<void> {
  const manager = userManager();
  localSettings.clear();

  // Best-effort: a failed revoke or cookie clear must not strand the user signed in at the provider.
  await Promise.allSettled([storeToken(null), manager.revokeTokens(), overlay.stop()]);
  await manager.signoutRedirect();
}
