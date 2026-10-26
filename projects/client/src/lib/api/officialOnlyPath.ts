const OFFICIAL_ONLY = [
  /^\/v3\//,
  /(^|\/)watchnow(\/|$)/,
  /^\/users\/[^/]+\/progress\//,
  /^\/lists\/[^/]+\/collaborators(\/|$)/,
] as const;

/**
 * Whether the API keeps `pathname` (`/movies/fight-club-1999/watchnow/us`) for Trakt's own apps. Any other client ID,
 * Premium included, gets a 403 there on either host.
 */
export const officialOnlyPath = (pathname: string) => OFFICIAL_ONLY.some((pattern) => pattern.test(pathname));
