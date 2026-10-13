import { z } from 'zod/v4';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { socialActivitySchema } from './socialActivitySchema.ts';
import { type SocialWindow, socialWindows } from './socialWindows.ts';
import { type SocialItem, type SocialMember, toSocialItem } from './toSocialItem.ts';

type FetchSocialFeedParams = {
  fetch: typeof globalThis.fetch;
  token: string;
  /** How many members the viewer follows (`fetchFollowingCount`). Null when that didn't load. */
  following: Promise<number | null>;
  now: Date;
  datePreferences: DatePreferences;
};

export type SocialFeed = {
  /** False when the viewer follows nobody: the panel asks them to follow someone instead. */
  readonly follows: boolean;
  /** The last 24 hours of watches, ratings and comments, newest first: the Today period. */
  readonly items: readonly SocialItem[];
  /** Up to 10 members active in the last 24 hours, most recent first: the ones worth asking what they're watching. */
  readonly recent: readonly SocialMember[];
};

/** A GET against the API: the server's fetch with the viewer's token, or the browser's queue. */
export type SocialGet = (path: string) => Promise<Response>;

const RECENT_MEMBERS = 10;
/** The worker's page size limit. A window with more rows pages on, up to `MAX_PAGES`. */
const PER_PAGE = 250;
const MAX_PAGES = 4;

const rowsSchema = z.array(z.unknown());

async function fetchPage(get: SocialGet, window: SocialWindow, page: number, datePreferences: DatePreferences) {
  const search = new URLSearchParams({
    start_at: window.start,
    end_at: window.end,
    limit: `${PER_PAGE}`,
    page: `${page}`,
    extended: 'full,images',
  });
  const response = await get(`/v3/users/me/following/activities?${search}`);
  if (response.status !== 200) throw new Error(`The Social Feed failed with ${response.status}`);

  const rows = rowsSchema.safeParse(await response.json().catch(() => null));
  if (!rows.success) throw new Error('The Social Feed returned an invalid feed');

  // A row this panel can't show (a watch with no media) is skipped rather than failing the others.
  const items = rows.data.flatMap((row) => {
    const activity = socialActivitySchema.safeParse(row);
    return activity.success ? [toSocialItem(activity.data, datePreferences)] : [];
  });
  return { items, pages: Number(response.headers.get('x-pagination-page-count')) || 1 };
}

async function fetchWindow(get: SocialGet, window: SocialWindow, datePreferences: DatePreferences) {
  const first = await fetchPage(get, window, 1, datePreferences);
  const rest = await Promise.all(
    Array.from(
      { length: Math.min(first.pages, MAX_PAGES) - 1 },
      (_, i) => fetchPage(get, window, i + 2, datePreferences),
    ),
  );
  return [first, ...rest].flatMap(({ items }) => items);
}

type FetchSocialItemsParams = { get: SocialGet; windows: readonly SocialWindow[]; datePreferences: DatePreferences };

/**
 * Every watch, rating and comment in the windows, newest first. A window that fails is left out as long as another
 * one answered; when none do, the first error is thrown.
 */
export async function fetchSocialItems(
  { get, windows, datePreferences }: FetchSocialItemsParams,
): Promise<readonly SocialItem[]> {
  const results = await Promise.all(
    windows.map((window) => fetchWindow(get, window, datePreferences).catch((error: unknown) => ({ error }))),
  );
  const found = results.flatMap((result) => ('error' in result ? [] : [result]));
  const failed = results.find((result) => 'error' in result);
  if (found.length === 0 && failed) throw failed.error;

  // Both ends of a window are inclusive, so a row on a boundary can come back twice.
  const items = found.flat();
  return items
    .filter((item, i) => items.findIndex(({ key }) => key === item.key) === i)
    .toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/**
 * The Social Feed's Today: what the people the viewer follows watched, rated and said in the last 24 hours, from the
 * worker's v3 feed. That feed falls back to the Trakt team's activity when you follow nobody, so a viewer who follows
 * nobody gets the empty panel without asking.
 */
export async function fetchSocialFeed(
  { fetch, token, following, now, datePreferences }: FetchSocialFeedParams,
): Promise<SocialFeed> {
  if ((await following) === 0) return { follows: false, items: [], recent: [] };

  const items = await fetchSocialItems({
    get: (path) => rawApiFetch({ fetch, token, path }),
    windows: socialWindows('today', now, datePreferences.timeZone),
    datePreferences,
  });
  const members = items.map(({ member }) => member).filter(({ slug }) => slug);

  return {
    follows: true,
    items,
    recent: members.filter((member, i) => members.findIndex(({ key }) => key === member.key) === i)
      .slice(0, RECENT_MEMBERS),
  };
}
