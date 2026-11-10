import { login } from './login.ts';
import { userManager } from './userManager.ts';

/**
 * An action's gate: true for a signed-in viewer. Signed out, it starts sign-in, which comes back to this page, and
 * answers false so the action stops.
 */
export async function requireSignIn(): Promise<boolean> {
  if ((await userManager().getUser())?.access_token) return true;
  await login('gate');
  return false;
}
