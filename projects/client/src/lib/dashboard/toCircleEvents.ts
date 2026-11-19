import type { SocialWindow } from './socialWindows.ts';
import { type SocialDetail, toSocialDetails } from './toSocialDetails.ts';
import { type SocialTag, tagOf } from './toSocialTag.ts';
import type { SocialItem, SocialMember } from './toSocialItem.ts';

/** One title several people the viewer follows watched, rated or commented on this week. */
export type CircleEvent = {
  readonly title: SocialItem['title'];
  /** The show's or movie's own fanart, for the banner. */
  readonly fanart?: string;
  /** Everyone on it, most recently active first. */
  readonly people: readonly SocialMember[];
  readonly watched: readonly SocialMember[];
  /** Every watch between them: an episode or a movie, once each time. */
  readonly plays: number;
  /** Each member's latest rating of the title itself, not of one of its episodes. */
  readonly ratings: readonly number[];
  readonly commented: readonly SocialMember[];
  /** Each person's part, for the expanded featured title. */
  readonly details: readonly SocialDetail[];
  /** What stands out about it, as the poster tags say it. */
  readonly tag?: SocialTag;
};

export type CircleEvents = {
  /** The title most of the viewer's circle is on, when it's big enough to feature. */
  readonly featured: CircleEvent | null;
  /** The next few titles several people are on. */
  readonly standouts: readonly CircleEvent[];
};

/** A featured title needs this many people, and this share of who the viewer follows. */
export const FEATURED_PEOPLE = 5;
export const FEATURED_SHARE = 0.05;
/** A standout needs this many people. */
export const STANDOUT_PEOPLE = 3;
const STANDOUTS = 3;

type Tally = {
  title: SocialItem['title'];
  fanart?: string;
  latest: number;
  people: Map<string, SocialMember>;
  watched: Map<string, SocialMember>;
  items: SocialItem[];
  ratings: Map<string, number>;
  commented: Map<string, SocialMember>;
};

function tally(items: readonly SocialItem[]): Tally[] {
  const byTitle = new Map<string, Tally>();
  // Newest first, so each member's first row seen is their latest.
  for (const item of items.toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at))) {
    const entry: Tally = byTitle.get(item.title.key) ?? {
      title: item.title,
      fanart: item.fanart,
      latest: Date.parse(item.at),
      people: new Map(),
      watched: new Map(),
      items: [],
      ratings: new Map(),
      commented: new Map(),
    };
    byTitle.set(item.title.key, entry);
    entry.fanart ??= item.fanart;
    const who = item.member.key;

    if (item.kind === 'watch' || item.kind === 'checkin') {
      entry.watched.set(who, entry.watched.get(who) ?? item.member);
    } else if (item.kind === 'rating') {
      const own = item.target.type === item.title.target.type && item.target.id === item.title.target.id;
      if (own && item.rating !== undefined && !entry.ratings.has(who)) entry.ratings.set(who, item.rating);
    } else {
      entry.commented.set(who, entry.commented.get(who) ?? item.member);
    }
    entry.people.set(who, entry.people.get(who) ?? item.member);
    entry.items.push(item);
  }
  return [...byTitle.values()];
}

const toEvent = (entry: Tally, windows: readonly SocialWindow[]): CircleEvent => ({
  title: entry.title,
  fanart: entry.fanart,
  people: [...entry.people.values()],
  watched: [...entry.watched.values()],
  plays: entry.items.filter(({ kind }) => kind === 'watch' || kind === 'checkin').length,
  ratings: [...entry.ratings.values()],
  commented: [...entry.commented.values()],
  details: toSocialDetails(entry.items, windows),
  tag: tagOf(entry.items),
});

/**
 * The week's standout titles in the viewer's circle: whatever the most people they follow watched, rated or commented
 * on. The top one is featured when at least `FEATURED_PEOPLE` people, and `FEATURED_SHARE` of who the viewer follows,
 * are on it; `following` is null when that count didn't load, and then the people alone decide. The next few with at
 * least `STANDOUT_PEOPLE` are standouts. Ties go to the most recent activity.
 */
export function toCircleEvents(
  items: readonly SocialItem[],
  following: number | null,
  windows: readonly SocialWindow[],
): CircleEvents {
  const ranked = tally(items)
    .filter((entry) => entry.people.size >= STANDOUT_PEOPLE)
    .toSorted((a, b) => b.people.size - a.people.size || b.latest - a.latest);

  const [top] = ranked;
  const big =
    top !== undefined &&
    top.people.size >= FEATURED_PEOPLE &&
    (following === null || top.people.size / following >= FEATURED_SHARE);

  const featured = big ? toEvent(top, windows) : null;
  return {
    featured,
    standouts: ranked.slice(featured ? 1 : 0, (featured ? 1 : 0) + STANDOUTS).map((entry) => toEvent(entry, windows)),
  };
}

/** The average of the ratings, 1 to 10, or undefined with none. */
export const averageRating = (ratings: readonly number[]) =>
  ratings.length === 0 ? undefined : ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
