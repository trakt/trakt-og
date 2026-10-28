// The loader that covers og while the browser leaves for auth.trakt.tv. Sign In and Sign Out links start it from the
// page they're on, and the root layout renders it. Start it from clicks only: this module is shared by every request
// on the server.
import type { AuthScene } from './authScenes.ts';
import { login } from './login.ts';
import { logout } from './logout.ts';
import { opensElsewhere } from './opensElsewhere.ts';
import { returnPath } from './returnPath.ts';

type LinkClick = MouseEvent & { currentTarget: EventTarget & Element };

let current = $state<AuthScene | null>(null);

// A failed start falls back to the link's own page, which says why and tries again.
function follow(event: LinkClick, scene: AuthScene, start: (url: URL) => Promise<void>): void {
  const link = event.currentTarget;
  if (!(link instanceof HTMLAnchorElement) || opensElsewhere(event)) return;

  event.preventDefault();
  const url = new URL(link.href);
  current = scene;
  start(url).catch(() => location.assign(url));
}

export const authStep = {
  get current() {
    return current;
  },
  /** A link to `/signin`: straight to auth.trakt.tv, coming back to its `redirect_to` as that page would. */
  signIn(event: LinkClick): void {
    follow(event, 'signIn', (url) => login(returnPath(url.searchParams.get('redirect_to'))));
  },
  /** The link to `/signout`: signs out from this page. */
  signOut(event: LinkClick): void {
    follow(event, 'signOut', () => logout());
  },
  /** Back from auth.trakt.tv can restore the page with the loader still up. */
  clear(): void {
    current = null;
  },
};
