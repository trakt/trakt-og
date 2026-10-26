/** Drops FadeHideMenu's saved Hide (`filter-hide-<cookie>`), so a Hide cleared from an empty state stays cleared. */
export function expireHideCookie(cookie: string) {
  document.cookie = `filter-hide-${cookie}=; path=/; samesite=lax; max-age=0`;
}
