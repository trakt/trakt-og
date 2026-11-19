import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { GenreBar } from '../users/profile/toGenreBar.ts';
import { countLabel } from '../utils/countLabel.ts';
import { formatDate } from '../utils/formatDate.ts';
import type { LiveWatch } from './fetchWatching.ts';
import type { SocialWindow } from './socialWindows.ts';
import type { SocialItem, SocialMember, SocialTarget } from './toSocialItem.ts';
import { memberPageHref } from './memberPageHref.ts';
import { type SocialDetail, toSocialDetails, toTitleDetails } from './toSocialDetails.ts';
import { type SocialTag, tagOf } from './toSocialTag.ts';
import { uniqueBy } from '../utils/uniqueBy.ts';
import { dayIn } from '../utils/dayIn.ts';

export type SocialView = 'title' | 'person' | 'time';

/** A piece of the line under a poster, joined with dots: words or a link. */
export type SocialLinePart = { readonly text: string; readonly href?: string };

/** One poster in the Social Feed's grid. */
export type SocialCard = {
  readonly key: string;
  /** Where the poster goes: the title, the member's history for the period, or the episode or movie. */
  readonly href: string;
  readonly title: string;
  /** An episode's "1x09", bold before the title. */
  readonly number?: string;
  readonly line: readonly SocialLinePart[];
  /** Their rating, a line of its own as on the ratings page, linking to their ratings. */
  readonly rating?: { readonly value: number; readonly href?: string };
  /** The poster's image path from the API. */
  readonly poster?: string;
  /** The faces on the poster, latest first. */
  readonly members: readonly SocialMember[];
  /** What the quick icons act on. */
  readonly target: SocialTarget;
  /** A member's titles past their share, folded into this one card: how many it stands for. */
  readonly folded?: number;
  /** A person's card: their face heads its details instead of a poster. */
  readonly member?: SocialMember;
  readonly tag?: SocialTag;
  /** Each member's part, latest first, for the card's details. */
  readonly details?: readonly SocialDetail[];
};

export type SocialBoard = {
  readonly cards: readonly SocialCard[];
  /** What the cards count before any fold: titles, people or activities. */
  readonly total: number;
  /** Each member's share of the period's activity, most active first, for the band. */
  readonly bars: readonly GenreBar[];
  readonly stats: { readonly activities: number; readonly people: number; readonly titles: number };
};

type ToSocialBoardParams = {
  /** The period's rows, newest first. */
  items: readonly SocialItem[];
  /** Who's watching now, when the period runs up to now. */
  live: readonly LiveWatch[];
  view: SocialView;
  /** The period's windows, newest first: a member's history links cover them. */
  windows: readonly SocialWindow[];
  now: Date;
  datePreferences: DatePreferences;
};

type Context = Omit<ToSocialBoardParams, 'items' | 'live' | 'view'>;

/** A watch, rating or comment, or a live watch, as one thing someone did. */
type Activity =
  | { readonly item: SocialItem; readonly live?: undefined }
  | {
      readonly item?: undefined;
      readonly live: LiveWatch;
    };

const isWatch = (item: SocialItem) => item.kind === 'watch' || item.kind === 'checkin';
const isMovie = (target: SocialTarget) => target.type === 'movie';
const unique = <T>(values: readonly T[]) => [...new Set(values)];
const memberOf = (activity: Activity) => (activity.item ?? activity.live).member;
const titleOf = (activity: Activity) => (activity.item ?? activity.live).title;

function clock(at: string, { timeZone, hour24 }: DatePreferences): string {
  return new Date(at).toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: hour24 ? 'h23' : 'h12',
  });
}

/** "Today", "Yesterday", "Saturday", then "Oct 3, 2026" past a week. */
function dayWord(at: string, { now, datePreferences }: Context): string {
  const { timeZone } = datePreferences;
  const days = Math.round(
    (Date.parse(dayIn(now.toISOString(), timeZone)) - Date.parse(dayIn(at, timeZone))) / 86_400_000,
  );
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return formatDate(at, { ...datePreferences, format: days < 7 ? 'dddd' : 'll' });
}

/** When, to end a line: "at 10:23 PM" today, then "yesterday", "on Saturday", "on Oct 3, 2026". */
function shortWhen(at: string, context: Context): string {
  const day = dayWord(at, context);
  if (day === 'Today') return `at ${clock(at, context.datePreferences)}`;
  return day === 'Yesterday' ? 'yesterday' : `on ${day}`;
}

/** "today at 10:23 PM", "Saturday at 9:14 PM". */
function fullWhen(at: string, context: Context): string {
  const day = dayWord(at, context);
  return `${day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day} at ${clock(at, context.datePreferences)}`;
}

/** A line that starts with when: "Yesterday at 9:14 PM". */
const capitalized = ({ text, href }: SocialLinePart): SocialLinePart => ({
  text: text.charAt(0).toUpperCase() + text.slice(1),
  ...(href && { href }),
});

/** A member's page for the period's windows. */
const memberHref = (member: SocialMember, { windows }: Context, page?: string, item?: SocialTarget) =>
  memberPageHref(member, windows, page, item);

function activitiesOf(items: readonly SocialItem[], live: readonly LiveWatch[]): readonly Activity[] {
  const watching = live.toSorted((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  return [...watching.map((watch) => ({ live: watch })), ...items.map((item) => ({ item }))];
}

/** Each member in the order they last did something, now first. */
function membersOf(activities: readonly Activity[]): readonly SocialMember[] {
  const members = activities.map(memberOf);
  return uniqueBy(members, ({ key }) => key);
}

function groupBy(activities: readonly Activity[], key: (activity: Activity) => string) {
  const groups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const group = groups.get(key(activity));
    if (group) group.push(activity);
    else groups.set(key(activity), [activity]);
  }
  return [...groups.values()];
}

/** A comment or review as words that open it. */
const commentLine = (item: SocialItem): SocialLinePart => ({
  text: item.kind === 'review' ? 'Reviewed' : 'Commented',
  href: item.comment?.href,
});

/** The first rating among the rows, as a card's rating line. */
function ratingOf(items: readonly (SocialItem | undefined)[], context: Context): SocialCard['rating'] {
  const rated = items.find((item) => item?.kind === 'rating' && item.rating);
  return rated?.rating ? { value: rated.rating, href: memberHref(rated.member, context, 'ratings') } : undefined;
}

/** What one member did with a title, then when: "Watched 1x09 at 10:30 PM", "Watched 3 episodes on Saturday". */
function soloLine(group: readonly Activity[], context: Context): readonly SocialLinePart[] {
  const items = group.flatMap(({ item }) => (item ? [item] : []));
  const watches = items.filter(isWatch);
  const [latest] = watches;
  if (!latest) {
    const comment = items.find(({ kind }) => kind === 'comment' || kind === 'review');
    const [first] = items;
    if (!first) return [];
    const what = comment ? commentLine(comment) : { text: 'Rated', href: memberHref(first.member, context, 'ratings') };
    return [what, { text: shortWhen((comment ?? first).at, context) }];
  }

  const when = { text: shortWhen(latest.at, context) };
  const history = memberHref(latest.member, context, 'history', latest.title.target);
  if (isMovie(latest.title.target)) return [{ text: 'Watched', href: history }, when];
  const episodes = unique(watches.map(({ code }) => code));
  return episodes.length === 1 && latest.code
    ? [{ text: `Watched ${latest.code}`, href: latest.href }, when]
    : [{ text: `Watched ${countLabel(episodes.length, 'episode')}`, href: history }, when];
}

/** What several members did with a title, each counted once: "3 watched, 2 rated". */
function groupLine(items: readonly SocialItem[]): readonly SocialLinePart[] {
  const who = (match: (item: SocialItem) => boolean) => unique(items.filter(match).map(({ member }) => member.key));
  const text = [
    { word: 'watched', count: who(isWatch).length },
    { word: 'rated', count: who(({ kind }) => kind === 'rating').length },
    { word: 'commented', count: who(({ kind }) => kind === 'comment' || kind === 'review').length },
  ]
    .flatMap(({ word, count }) => (count > 0 ? [`${count} ${word}`] : []))
    .join(', ');
  return text ? [{ text }] : [];
}

function byTitle(activities: readonly Activity[], context: Context): SocialCard[] {
  return groupBy(activities, (activity) => titleOf(activity).key).map((group) => {
    const members = membersOf(group);
    const [first] = group;
    const title = first ? titleOf(first) : null;
    if (!title) throw new Error('An empty title group');
    const items = group.flatMap(({ item }) => (item ? [item] : []));

    return {
      key: `title:${title.key}`,
      href: title.href,
      title: title.name,
      line: members.length > 1 ? groupLine(items) : soloLine(group, context),
      rating:
        members.length > 1
          ? undefined
          : ratingOf(
              group.map(({ item }) => item),
              context,
            ),
      poster: title.poster,
      members,
      target: title.target,
      tag: tagOf(items),
      details: toSocialDetails(items, context.windows),
    };
  });
}

/** Past this many titles, a member's others fold into one card, so one busy friend can't fill the grid. */
const PER_MEMBER = 2;

/** A member's titles past their share as one card, opening their history for the period. */
function foldOf(cards: readonly SocialCard[], context: Context): SocialCard {
  const [next] = cards;
  const member = next?.members[0];
  if (!next || !member) throw new Error('An empty fold');

  const history = memberHref(member, context);
  return {
    key: `more:${member.key}`,
    href: history ?? next.href,
    title: member.name,
    line: [{ text: countLabel(cards.length, 'more title'), href: history }],
    poster: next.poster,
    members: [member],
    target: next.target,
    folded: cards.length,
  };
}

/**
 * Each member's latest title in turn, the most recently active first, then each one's next, so a row shows as many
 * people as it can. A title several members touched is its latest member's. Past `PER_MEMBER` titles, a member's
 * others fold into one card, unless there's only one more.
 */
function fairShare(cards: readonly SocialCard[], context: Context): SocialCard[] {
  const queues = new Map<string, SocialCard[]>();
  for (const card of cards) {
    const key = card.members[0]?.key ?? card.key;
    const queue = queues.get(key);
    if (queue) queue.push(card);
    else queues.set(key, [card]);
  }

  const turns = Array.from({ length: PER_MEMBER + 1 }, (_, turn) =>
    [...queues.values()].flatMap((queue): SocialCard[] => {
      if (turn < PER_MEMBER || queue.length === PER_MEMBER + 1) return queue.slice(turn, turn + 1);
      return queue.length > PER_MEMBER ? [foldOf(queue.slice(PER_MEMBER), context)] : [];
    }),
  );
  return turns.flat();
}

function byPerson(activities: readonly Activity[], context: Context): SocialCard[] {
  return groupBy(activities, (activity) => memberOf(activity).key).map((group) => {
    const [latest] = group;
    if (!latest) throw new Error('An empty member group');
    const member = memberOf(latest);
    const title = titleOf(latest);
    const titles = unique(group.map((activity) => titleOf(activity).key)).length;
    const history = memberHref(member, context);
    const items = group.flatMap(({ item }) => (item ? [item] : []));

    return {
      key: `person:${member.key}`,
      href: history ?? title.href,
      title: member.name,
      line: [{ text: countLabel(titles, 'title'), href: history }],
      poster: title.poster,
      members: [member],
      target: title.target,
      member,
      tag: tagOf(items.filter((item) => item.title.key === title.key)),
      details: toTitleDetails(items, context.windows),
    };
  });
}

/** A member's run of one title's episodes, newest first, back to back in their own activity. */
type Run = { readonly items: SocialItem[] };

function runsOf(activities: readonly Activity[]): readonly Run[] {
  const runs: Run[] = [];
  const lastRun = new Map<string, Run>();
  for (const { item } of activities) {
    if (!item) continue;
    const open = lastRun.get(item.member.key);
    const head = open?.items.at(-1);
    if (open && head && isWatch(head) && isWatch(item) && head.title.key === item.title.key && !isMovie(item.target)) {
      open.items.push(item);
      continue;
    }
    const run = { items: [item] };
    runs.push(run);
    lastRun.set(item.member.key, run);
  }
  return runs;
}

function byTime(activities: readonly Activity[], context: Context): SocialCard[] {
  return runsOf(activities).map(({ items }): SocialCard => {
    const [item] = items;
    if (!item) throw new Error('An empty run');
    const when = { text: fullWhen(item.at, context) };
    const common = {
      key: `time:${item.key}`,
      poster: item.title.poster,
      members: [item.member],
      tag: tagOf(items),
    };
    const episodes = unique(items.map(({ code }) => code)).length;

    if (episodes > 1) {
      const history = memberHref(item.member, context, 'history', item.title.target);
      return {
        ...common,
        href: item.title.href,
        title: item.title.name,
        line: [{ text: countLabel(episodes, 'episode'), href: history }, when],
        target: item.title.target,
      };
    }
    return {
      ...common,
      href: item.comment?.href ?? item.href,
      title: item.title.name,
      number: item.code,
      line: item.comment ? [commentLine(item), when] : [capitalized(when)],
      rating: ratingOf([item], context),
      target: item.target,
    };
  });
}

/** Each count links to that member's page for it: their episode and movie history for the period, ratings, comments. */
const TYPES = [
  { key: 'episodes', word: 'episode', page: 'history/episodes' },
  { key: 'movies', word: 'movie', page: 'history/movies' },
  { key: 'ratings', word: 'rating', page: 'ratings' },
  { key: 'comments', word: 'comment', page: 'comments' },
] as const;

/** Each member's episodes, movies, ratings and comments as a band piece, the most active first. */
function barsOf(activities: readonly Activity[], context: Context): GenreBar[] {
  const tallies = groupBy(activities, (activity) => memberOf(activity).key)
    .map((group) => {
      const target = ({ item, live }: Activity) => (item ?? live).title.target;
      const watched = group.filter(({ item }) => !item || isWatch(item));
      const counts = {
        episodes: watched.filter((activity) => !isMovie(target(activity))).length,
        movies: watched.filter((activity) => isMovie(target(activity))).length,
        ratings: group.filter(({ item }) => item?.kind === 'rating').length,
        comments: group.filter(({ item }) => item?.kind === 'comment' || item?.kind === 'review').length,
      };
      const titles = (movie: boolean) =>
        unique(group.filter((activity) => isMovie(target(activity)) === movie).map((a) => titleOf(a).key)).length;
      const [first] = group;
      if (!first) throw new Error('An empty member group');
      return { member: memberOf(first), total: group.length, counts, shows: titles(false), movies: titles(true) };
    })
    .toSorted((a, b) => b.total - a.total);

  const all = tallies.reduce((sum, { total }) => sum + total, 0) || 1;
  const top = tallies[0]?.total || 1;

  return tallies.map(({ member, total, counts, shows, movies }) => {
    const percentage = (total / all) * 100;
    return {
      slug: member.key,
      name: member.name,
      avatar: member.avatar,
      href: member.href,
      percentage,
      percentageRow: (total / top) * 100,
      percentageText: `${percentage.toFixed(0)}%`,
      shows,
      movies,
      counts: TYPES.flatMap(({ key, word, page }) => {
        const href = memberHref(member, context, page);
        const count = counts[key];
        if (count === 0 || !href) return [];
        return [{ value: count.toLocaleString('en-US'), noun: `${word}${count === 1 ? '' : 's'}`, href }];
      }),
    };
  });
}

/**
 * The Social Feed's grid and band for one period. Title groups everyone's rows by show or movie, each member's titles
 * taking turns and past two folding into one card, person groups by member, and time lists each row, with a member's back-to-back episodes of one show as one card. Whoever's watching now
 * has a card of their own above the grid, so they count toward the band and the counts but not the grid. The line under each poster links where it can: the episode, the
 * member's history for the period (or for that title), their ratings, the comment.
 */
export function toSocialBoard({ items, live, view, ...context }: ToSocialBoardParams): SocialBoard {
  const done = activitiesOf(items, []);
  const activities = activitiesOf(items, live);
  const cards =
    view === 'title' ? byTitle(done, context) : view === 'person' ? byPerson(done, context) : byTime(done, context);

  return {
    cards: view === 'title' ? fairShare(cards, context) : cards,
    total: cards.length,
    bars: barsOf(activities, context),
    stats: {
      activities: activities.length,
      people: membersOf(activities).length,
      titles: unique(activities.map((activity) => titleOf(activity).key)).length,
    },
  };
}
