// Trakt's sites whose pages og mirrors under the same paths.
export const TRAKT_HOSTS: ReadonlySet<string> = new Set([
  'trakt.tv',
  'www.trakt.tv',
  'og.trakt.tv',
  'app.trakt.tv',
  'tvtime.trakt.tv',
]);

/** The og path a Trakt link would have, or `undefined` for any other host. */
export function ogPath(href: string): string | undefined {
  const url = URL.canParse(href) ? new URL(href) : undefined;
  return url && TRAKT_HOSTS.has(url.hostname) ? `${url.pathname}${url.search}` : undefined;
}

/** A typed Trakt URL as it reads on og: the host becomes og.trakt.tv, the rest stays as typed. */
export function ogLabel(typed: string): string {
  return typed.replace(/^(https?:\/\/)?[^/?#]+/i, '$1og.trakt.tv');
}
