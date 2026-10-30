import { z } from 'zod/v4';
import { uniqueBy } from '$lib/utils/uniqueBy';

/** The bar before a member changes it: OG's main links. */
const DEFAULTS: readonly string[] = ['dashboard', 'discover', 'shows', 'movies', 'calendar'];
/** Enough for the main links and five more; the bar folds what doesn't fit into More anyway. */
const MAX = 10;

/** Every signed-in member on this browser, by slug. */
const cookieSchema = z.record(z.string(), z.unknown());
const linksSchema = z.array(z.string());

const COOKIE = 'og-header';
/** Browsers cap a cookie's lifetime at 400 days. */
const MAX_AGE = 400 * 86_400;

function members(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = cookieSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

function read(value: string | undefined, slug: string): readonly string[] | null {
  const parsed = linksSchema.safeParse(members(value)[slug]);
  return parsed.success ? uniqueBy(parsed.data, (id) => id).slice(0, MAX) : null;
}

const isDefault = (ids: readonly string[]) =>
  ids.length === DEFAULTS.length && ids.every((id, index) => id === DEFAULTS.at(index));

// A member back on the defaults drops out, so the cookie only holds bars someone changed.
function write(value: string | undefined, slug: string, ids: readonly string[]): string {
  const { [slug]: _, ...others } = members(value);
  return JSON.stringify(isDefault(ids) ? others : { ...others, [slug]: ids });
}

function browserCookie(): string | undefined {
  const entry = document.cookie.split('; ').find((pair) => pair.startsWith(`${COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(COOKIE.length + 1)) : undefined;
}

/**
 * The per-browser store for the links a member keeps in the header, in bar order. It's one cookie, so the server
 * draws the member's bar on the first paint and the header's edit mode writes it in the browser. The value is JSON of
 * each member's link ids, `{"<slug>": ["dashboard", "movies-boxoffice", "watchlist"]}`.
 */
export const headerLinkPrefs = {
  COOKIE,
  DEFAULTS,
  MAX,
  /** The member's saved links from the cookie's (decoded) value, or null when they never changed the bar. */
  read,
  /** The cookie's next value with the member's links replaced, keeping everyone else's. */
  write,
  /** In the browser: save the member's links. */
  save(slug: string, ids: readonly string[]): void {
    const next = write(browserCookie(), slug, ids);
    const secure = location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${COOKIE}=${encodeURIComponent(next)}; path=/; samesite=lax; max-age=${MAX_AGE}${secure}`;
  },
};
