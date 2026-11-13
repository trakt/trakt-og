import type { BeforeNavigate } from '$app/navigation';

const GUEST_ROUTES: ReadonlySet<string> = new Set(['/', '/about', '/help', '/signin', '/callback', '/signout']);

type Params = {
  hasSession: boolean;
  navigation: Pick<BeforeNavigate, 'type' | 'from' | 'to'>;
};

/**
 * Whether a guest's click goes to sign in instead, as trakt-web's links send guests away. A guest sees any page they
 * open by its link, and the home, about, help and sign-in pages from anywhere. Other sites, endpoints, anchors on the
 * same page, back and forward, and the app's own navigation go through.
 */
export function isGuestGated({ hasSession, navigation: { type, from, to } }: Params): boolean {
  if (hasSession) return false;
  if (type !== 'link') return false;
  if (!to?.route.id) return false;
  if (from && to.url.origin !== from.url.origin) return false;
  if (from && to.url.pathname === from.url.pathname && to.url.search === from.url.search) return false;

  return !GUEST_ROUTES.has(to.route.id);
}
