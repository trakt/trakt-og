/**
 * An API `updated_at` as a sitemap `lastmod` (W3C Datetime, to the second). Missing or unreadable gives none, so a
 * sitemap never claims a date the API didn't send.
 */
export function toLastmod(updatedAt: string | null | undefined): string | undefined {
  if (!updatedAt) return undefined;

  const time = Date.parse(updatedAt);
  if (Number.isNaN(time)) return undefined;

  return new Date(time).toISOString().replace(/\.\d{3}Z$/, 'Z');
}
