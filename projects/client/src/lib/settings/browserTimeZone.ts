const COOKIE = 'og-time-zone';
/** Browsers cap a cookie's lifetime at 400 days. */
const MAX_AGE = 400 * 86_400;

function isTimeZone(zone: string | undefined): zone is string {
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The browser's time zone, kept in a cookie so the server renders dates in it too and hydration agrees. */
export const browserTimeZone = {
  COOKIE,
  /** The zone from the cookie's value, if it's a real one. */
  read: (value: string | undefined): string | undefined => (isTimeZone(value) ? value : undefined),
  /** In the browser: keep the browser's current zone and return it. */
  save(): string {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const secure = location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${COOKIE}=${encodeURIComponent(zone)}; path=/; samesite=lax; max-age=${MAX_AGE}${secure}`;
    return zone;
  },
};
