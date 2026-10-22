import { dayIn } from '../calendars/calendarDays.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { GenreBar } from '../users/profile/toGenreBar.ts';
import { countLabel } from '../utils/countLabel.ts';
import { formatDate } from '../utils/formatDate.ts';
import type { LiveWatch } from './fetchWatching.ts';
import type { SocialWindow } from './socialWindows.ts';
import type { SocialItem, SocialMember, SocialTarget } from './toSocialItem.ts';
import { uniqueBy } from '../utils/uniqueBy.ts';

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
};

export type SocialBoard = {
  readonly cards: readonly SocialCard[];
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
type Activity = { readonly item: SocialItem; readonly live?: undefined } | {
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

/** "10:23 PM" today, the day after that: "Yesterday", "Saturday". */
function shortWhen(at: string, context: Context): string {
  const day = dayWord(at, context);
  return day === 'Today' ? clock(at, context.datePreferences) : day;
}

/** "Today, 10:23 PM", "Saturday, 9:14 PM". */
const fullWhen = (at: string, context: Context) => `${dayWord(at, context)}, ${clock(at, context.datePreferences)}`;

/**
 * A member's page. Their history is limited to the period, and to one title with `item`; their ratings and comments
 * pages take no dates.
 */
function memberHref(member: SocialMember, { windows }: Context, page = 'history', item?: SocialTarget) {
  const start = windows.at(-1)?.start;
  const end = windows.at(0)?.end;
  if (!member.href) return undefined;
  if (!page.startsWith('history') || !start || !end) return `${member.href}/${page}`;

  const search = new URLSearchParams({ start_at: start, end_at: end });
  if (item) search.set(item.type, `${item.id}`);
  return `${member.href}/${page}?${search}`;
}

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

/** What one member did with a title: "Watched 1x09 · 10:30 PM", "Watched 3 episodes", "Commented". */
function soloLine(group: readonly Activity[], context: Context): readonly SocialLinePart[] {
  const items = group.flatMap(({ item }) => (item ? [item] : []));
  const watches = items.filter(isWatch);
  const [latest] = watches;
  if (!latest) {
    const comment = items.find(({ kind }) => kind === 'comment' || kind === 'review');
    if (comment) return [commentLine(comment)];
    // Only rated: the heart has a line of its own, so this one says when.
    const [rated] = items;
    return rated
      ? [{ text: 'Rated', href: memberHref(rated.member, context, 'ratings') }, { text: shortWhen(rated.at, context) }]
      : [];
  }

  const when = { text: shortWhen(latest.at, context) };
  const history = memberHref(latest.member, context, 'history', latest.title.target);
  if (isMovie(latest.title.target)) return [{ text: 'Watched', href: history }, when];
  const episodes = unique(watches.map(({ code }) => code));
  return episodes.length === 1 && latest.code
    ? [{ text: `Watched ${latest.code}`, href: latest.href }, when]
    : [{ text: `Watched ${countLabel(episodes.length, 'episode')}`, href: history }];
}

function byTitle(activities: readonly Activity[], context: Context): SocialCard[] {
  return groupBy(activities, (activity) => titleOf(activity).key).map((group) => {
    const members = membersOf(group);
    const [first] = group;
    const title = first ? titleOf(first) : null;
    if (!title) throw new Error('An empty title group');

    return {
      key: `title:${title.key}`,
      href: title.href,
      title: title.name,
      line: members.length > 1 ? [{ text: countLabel(members.length, 'friend') }] : soloLine(group, context),
      rating: members.length > 1 ? undefined : ratingOf(group.map(({ item }) => item), context),
      poster: title.poster,
      members,
      target: title.target,
    };
  });
}

function byPerson(activities: readonly Activity[], context: Context): SocialCard[] {
  return groupBy(activities, (activity) => memberOf(activity).key).map((group) => {
    const [latest] = group;
    if (!latest) throw new Error('An empty member group');
    const member = memberOf(latest);
    const title = titleOf(latest);
    const titles = unique(group.map((activity) => titleOf(activity).key)).length;
    const history = memberHref(member, context);

    return {
      key: `person:${member.key}`,
      href: history ?? title.href,
      title: member.name,
      line: [{ text: countLabel(titles, 'title'), href: history }],
      poster: title.poster,
      members: [member],
      target: title.target,
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
    const common = { key: `time:${item.key}`, poster: item.title.poster, members: [item.member] };
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
      line: item.comment ? [commentLine(item), when] : [when],
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
  const tallies = groupBy(activities, (activity) => memberOf(activity).key).map((group) => {
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
  }).toSorted((a, b) => b.total - a.total);

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
        return counts[key] > 0 && href ? [{ text: countLabel(counts[key], word), href }] : [];
      }),
    };
  });
}

/**
 * The Social Feed's grid and band for one period. Title groups everyone's rows by show or movie, person by member,
 * and time lists each row, with a member's back-to-back episodes of one show as one card. Whoever's watching now
 * has a card of their own above the grid, so they count toward the band and the counts but not the grid. The line under each poster links where it can: the episode, the
 * member's history for the period (or for that title), their ratings, the comment.
 */
export function toSocialBoard({ items, live, view, ...context }: ToSocialBoardParams): SocialBoard {
  const done = activitiesOf(items, []);
  const activities = activitiesOf(items, live);
  const cards = view === 'title'
    ? byTitle(done, context)
    : view === 'person'
    ? byPerson(done, context)
    : byTime(done, context);

  return {
    cards,
    bars: barsOf(activities, context),
    stats: {
      activities: activities.length,
      people: membersOf(activities).length,
      titles: unique(activities.map((activity) => titleOf(activity).key)).length,
    },
  };
}
