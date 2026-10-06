import { z } from 'zod/v4';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { describeSitting, type SittingSummary } from './describeSitting.ts';
import { groupSittings, type Sitting } from './groupSittings.ts';
import { shortAgo } from './shortAgo.ts';
import { socialActivitySchema } from './socialActivitySchema.ts';
import { type SocialItem, type SocialMember, toSocialItem } from './toSocialItem.ts';

type FetchSocialFeedParams = {
  fetch: typeof globalThis.fetch;
  token: string;
  /** How many members the viewer follows (`fetchFollowingCount`). Null when that didn't load. */
  following: Promise<number | null>;
  now: Date;
  datePreferences: DatePreferences;
};

export type SocialSitting = Sitting & { readonly summary: SittingSummary };

export type SocialFeed = {
  /** Newest first, 12 at most. */
  readonly sittings: readonly SocialSitting[];
  /** The comments and reviews in those sittings, newest first, with how long ago: "11h". */
  readonly comments: readonly (SocialItem & { readonly ago: string })[];
  /** Up to 10 members active in the last 24 hours, most recent first: the ones worth asking what they're watching. */
  readonly recent: readonly SocialMember[];
};

const SITTINGS = 12;
const DAYS = 7;
/** The most rows a day's window asks for. A day with more keeps its newest. */
const PER_DAY = 100;
const RECENT_MEMBERS = 10;
const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

const rowsSchema = z.array(z.unknown());

type WindowParams = Omit<FetchSocialFeedParams, 'following'> & { day: number };

/** One day of watches, ratings and comments, the most the worker serves at once, newest first. */
async function fetchDay({ fetch, token, now, day, datePreferences }: WindowParams): Promise<readonly SocialItem[]> {
  // Minute boundaries, so the same page load asks for the same windows and the worker's cache can answer.
  const end = Math.floor(now.getTime() / MINUTE_MS) * MINUTE_MS - day * DAY_MS;
  const search = new URLSearchParams({
    start_at: new Date(end - DAY_MS).toISOString(),
    end_at: new Date(end).toISOString(),
    limit: `${PER_DAY}`,
    extended: 'full,images',
  });
  const response = await rawApiFetch({ fetch, token, path: `/v3/users/me/following/activities?${search}` });
  if (response.status !== 200) throw new Error(`The Social Feed failed with ${response.status}`);

  const rows = rowsSchema.safeParse(await response.json().catch(() => null));
  if (!rows.success) throw new Error('The Social Feed returned an invalid feed');

  // A row this panel can't show (a watch with no media) is skipped rather than failing the others.
  return rows.data.flatMap((row) => {
    const activity = socialActivitySchema.safeParse(row);
    return activity.success ? [toSocialItem(activity.data, datePreferences)] : [];
  });
}

/** Walks back a day at a time until 12 sittings turn up or the week runs out. */
async function collect(params: WindowParams, found: readonly SocialItem[]): Promise<readonly SocialItem[]> {
  if (groupSittings(found).length >= SITTINGS || params.day >= DAYS) return found;

  // Once some rows are in, a day that fails ends the walk instead of losing them.
  const day = await fetchDay(params).catch((error) => {
    if (found.length === 0) throw error;
    return null;
  });
  if (!day) return found;

  // Both ends of a window are inclusive, so a row on the boundary can come back twice.
  const fresh = day.filter((item) => !found.some(({ key }) => key === item.key));
  return collect({ ...params, day: params.day + 1 }, [...found, ...fresh]);
}

/**
 * The Social Feed: what the people the viewer follows watched, rated and said over the last week, as sittings, from
 * the worker's v3 feed. That feed serves 24 hours at a time and falls back to the Trakt team's activity when you
 * follow nobody, so a viewer who follows nobody gets the empty panel without asking.
 */
export async function fetchSocialFeed(
  { fetch, token, following, now, datePreferences }: FetchSocialFeedParams,
): Promise<SocialFeed> {
  if ((await following) === 0) return { sittings: [], comments: [], recent: [] };

  const all = groupSittings(await collect({ fetch, token, now, datePreferences, day: 0 }, []));
  const sittings = all.slice(0, SITTINGS).map((sitting) => ({
    ...sitting,
    summary: describeSitting({ sitting, now, datePreferences }),
  }));
  const recent = all
    .filter(({ member, newest }) => member.slug && now.getTime() - Date.parse(newest) < DAY_MS)
    .map(({ member }) => member)
    .filter((member, i, members) => members.findIndex(({ key }) => key === member.key) === i)
    .slice(0, RECENT_MEMBERS);

  return {
    sittings,
    comments: sittings.flatMap(({ items }) => items.filter(({ comment }) => comment))
      .toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .map((item) => ({ ...item, ago: shortAgo(item.at, now) })),
    recent,
  };
}
