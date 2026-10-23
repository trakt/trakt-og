/** The design shell's choices, kept in one cookie so the server paints the first frame in the picked theme. */
export type DesignPrefs = { readonly theme: 'light' | 'dark'; readonly collapsed: boolean };

const COOKIE = 'og-design';
const MAX_AGE = 31_536_000;

/** Light, OG's default, with the nav open. `?theme=` wins over the cookie, so a screenshot can ask for either. */
function read({ cookie, query }: { cookie: string | undefined; query: string | null }): DesignPrefs {
  const [theme, collapsed] = (cookie ?? '').split('.');
  const picked = query ?? theme;
  return { theme: picked === 'dark' ? 'dark' : 'light', collapsed: collapsed === 'collapsed' };
}

/** The `document.cookie` assignment that saves these prefs. */
function serialize(prefs: DesignPrefs) {
  const value = `${prefs.theme}.${prefs.collapsed ? 'collapsed' : 'open'}`;
  return `${COOKIE}=${value}; path=/_design; samesite=lax; max-age=${MAX_AGE}`;
}

export const designPrefs = { COOKIE, read, serialize };
