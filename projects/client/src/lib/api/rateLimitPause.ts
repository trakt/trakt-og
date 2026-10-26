// Without a usable `Retry-After`, a 429 pauses this long.
const FALLBACK_SECONDS = 60;

let until = 0;

/**
 * How long a Standard app holds its API requests after a 429. Requests sent while the API (or the firewall in front of
 * it) is refusing them only extend the block, and it covers every Trakt app on the same connection.
 */
export const rateLimitPause = {
  /** Whole seconds left, or 0 when requests may go out. */
  remaining(now = Date.now()): number {
    return Math.max(0, Math.ceil((until - now) / 1000));
  },
  /** Starts a pause from a 429's `Retry-After`, in seconds. */
  start(retryAfter: string | null, now = Date.now()) {
    const seconds = Number(retryAfter);
    until = now + (Number.isFinite(seconds) && seconds > 0 ? seconds : FALLBACK_SECONDS) * 1000;
  },
};
