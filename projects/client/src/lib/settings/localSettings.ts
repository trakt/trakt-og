import { z } from 'zod/v4';
import type { SettingsBody } from './SettingsBody.ts';

const COOKIE = 'og-local-settings';
/** Browsers cap a cookie's lifetime at 400 days. */
const MAX_AGE = 400 * 86_400;

// Display settings only. A profile change (`user`) must reach Trakt, or it would show here and nowhere else.
const bodySchema = z.object({
  account: z.record(z.string(), z.unknown()).optional(),
  browsing: z.record(z.string(), z.unknown()).optional(),
});

type Tree = { readonly [key: string]: unknown };
const isTree = (value: unknown): value is Tree => typeof value === 'object' && value !== null && !Array.isArray(value);

/** `patch` over `base`: objects merge key by key, anything else replaces. */
function merge<T>(base: T, patch: unknown): T {
  if (patch === undefined) return base;
  if (!isTree(base) || !isTree(patch)) return patch as T;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) merged[key] = merge(base[key], value);
  return merged as T;
}

/** The kept settings from the cookie's (decoded) value. */
function read(value: string | undefined): SettingsBody {
  if (!value) return {};
  try {
    const parsed = bodySchema.safeParse(JSON.parse(value));
    return parsed.success ? (parsed.data as SettingsBody) : {};
  } catch {
    return {};
  }
}

/** Whether `body` is a save this store can keep: display settings only. */
const keeps = (body: unknown): body is SettingsBody =>
  isTree(body) && Object.keys(body).length > 0 && bodySchema.strict().safeParse(body).success;

/** The cookie's next value with `body` laid over what it kept. */
const write = (value: string | undefined, body: SettingsBody) => JSON.stringify(merge(read(value), body));

function browserCookie(): string | undefined {
  const entry = document.cookie.split('; ').find((pair) => pair.startsWith(`${COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(COOKIE.length + 1)) : undefined;
}

function setCookie(value: string, maxAge: number) {
  const secure = location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${COOKIE}=${encodeURIComponent(value)}; path=/; samesite=lax; max-age=${maxAge}${secure}`;
}

/**
 * Settings kept in this browser for a client ID the API won't let save them. `PUT /users/settings` is open only to
 * Trakt's own apps, so on any other (a fork's Standard or Premium app) og keeps a display setting's change here
 * instead (`settingsRequest`), and the root layout lays it over the API's settings, on the server and in the browser
 * alike. og.trakt.tv saves to the API and never writes it. It's one cookie of JSON in the body's shape,
 * `{"browsing": {"progress": {"watched": {"grid_view": true}}}}`, cleared on sign-out.
 */
export const localSettings = {
  COOKIE,
  read,
  keeps,
  write,
  /** The API's settings with the kept ones laid over them. */
  apply: <T>(settings: T, value: string | undefined): T => merge(settings, read(value)),
  /** In the browser: keep `body`. */
  save(body: SettingsBody): void {
    setCookie(write(browserCookie(), body), MAX_AGE);
  },
  /** In the browser: forget everything kept. */
  clear(): void {
    setCookie('', 0);
  },
};
