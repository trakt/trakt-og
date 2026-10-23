import { redirect } from '@sveltejs/kit';

/** An old OG URL's redirect to og's path: each segment encoded, the query string kept. */
export function legacyRedirect(status: 301 | 302, segments: readonly string[], url: URL): never {
  redirect(status, `/${segments.map(encodeURIComponent).join('/')}${url.search}`);
}
