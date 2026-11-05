import type { ReadonlyURL } from '$app/state';
/** The sign-in page, sending the viewer back to this page with its query string once they've signed in. */
export function signInHref(url: ReadonlyURL): string {
  return `/signin?redirect_to=${encodeURIComponent(url.pathname + url.search)}`;
}
