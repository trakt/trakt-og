/**
 * How much longer a response's shared cache copy stays fresh, in milliseconds: its `s-maxage` (or `max-age`) less
 * its `Age`. Null when the response says neither, so the caller picks its own wait. Reading again before then only
 * gets the same copy back.
 */
export function cacheFreshFor(headers: Headers): number | null {
  const control = headers.get('cache-control') ?? '';
  const seconds = /s-maxage=(\d+)/.exec(control)?.[1] ?? /(?:^|[\s,])max-age=(\d+)/.exec(control)?.[1];
  if (seconds === undefined) return null;
  const age = Number.parseInt(headers.get('age') ?? '0', 10) || 0;
  return Math.max(0, Number(seconds) - age) * 1000;
}
