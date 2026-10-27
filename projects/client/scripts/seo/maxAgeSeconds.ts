/** The longest of `max-age` and `s-maxage` in a Cache-Control header, or 0 when neither is set. */
export function maxAgeSeconds(cacheControl: string | null): number {
  const ages = [...(cacheControl ?? '').matchAll(/\b(?:s-)?max-?age\s*=\s*(\d+)/gi)].map(([, age]) => Number(age));
  return Math.max(0, ...ages);
}
