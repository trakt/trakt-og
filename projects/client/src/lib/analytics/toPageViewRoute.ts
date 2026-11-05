import { isAuthStepRoute } from '#lib/auth/isAuthStepRoute.ts';

// The SvelteKit template, never a pathname: HAL cannot tell a template from a
// real path, so a pathname would store user slugs. Sign-in hops and the design
// demos are not page views; an unmatched route has no template at all.
export function toPageViewRoute(routeId: string | null | undefined): string | null {
  if (!routeId) return null;
  if (isAuthStepRoute(routeId)) return null;
  if (routeId.startsWith('/_design')) return null;

  return routeId;
}
