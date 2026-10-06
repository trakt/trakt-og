import { dayIn } from '../calendars/calendarDays.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { countLabel } from '../utils/countLabel.ts';
import { formatDate } from '../utils/formatDate.ts';
import type { Sitting } from './groupSittings.ts';
import { shortAgo } from './shortAgo.ts';
import type { SocialItem } from './toSocialItem.ts';

type Link = { readonly text: string; readonly href: string };

/** One line of a sitting's expanded list: a title's watches, a rating, or a comment, newest first. */
export type SittingLine = {
  readonly key: string;
  readonly kind: SocialItem['kind'];
  readonly name: string;
  readonly href: string;
  /** Its episodes or season, newest first: "2x07, 1x10". */
  readonly codes: string;
  readonly rating?: number;
  readonly at: string;
  /** The newest row's clock time: "11:17 PM". */
  readonly time: string;
};

/** A sitting as the panel writes it: title first, with the rest as chips, and the full sentence for screen readers. */
export type SittingSummary = {
  /** A row's headline: up to two titles ("Saved by the Bell, Raising Hope +25 shows"), or one with its episodes. */
  readonly head: { readonly links: readonly Link[]; readonly more: string | null };
  /**
   * A tile: the lead title (the one watched most recently) gives the headline ("Lioness 3x02 +1 show"), the still
   * (its newest episode's) and the heart, which shows only when it rates the lead.
   */
  readonly tile: {
    readonly link: Link | null;
    readonly more: string | null;
    readonly still: { readonly href: string; readonly path?: string };
    readonly heart: number | null;
  };
  /** The button that opens the list: "2 episodes", "33 episodes · 27 shows", "4 ratings". Null when the chips show it all. */
  readonly count: string | null;
  /** Ratings of titles they watched in the sitting. */
  readonly hearts: readonly number[];
  /** Ratings of titles they didn't watch in it. */
  readonly rated: readonly { readonly rating: number; readonly name: string }[];
  /** Each comment or review, and what it was on: "Lioness 3x02". */
  readonly comments: readonly { readonly id: number; readonly review: boolean; readonly on: string }[];
  /** A poster per headline title, in its order: up to three, or two and `more` ("+25") when there are more. */
  readonly posters: { readonly titles: readonly SocialItem['title'][]; readonly more: number };
  /** The expanded list: seven lines, then `more` ("Show 20 more shows") opens `rest`. */
  readonly list: {
    readonly lines: readonly SittingLine[];
    readonly rest: readonly SittingLine[];
    readonly more: string | null;
  };
  /** "8:20 AM – 11:17 PM", when the sitting spans two hours or more. */
  readonly span: string | null;
  /** "Kristin binged Lanterns 1x06–1x08 and rated it 10 out of 10." */
  readonly sentence: string;
  /** "Today", "Yesterday", "Friday", in the viewer's zone. */
  readonly day: string;
  /** Since the newest row: "24m", "15h", "2d". */
  readonly ago: string;
  /** The newest row is under an hour old. */
  readonly fresh: boolean;
};

type Bucket = {
  readonly title: SocialItem['title'];
  readonly watches: readonly SocialItem[];
  readonly ratings: readonly SocialItem[];
  readonly comments: readonly SocialItem[];
};

const isWatch = ({ kind }: SocialItem) => kind === 'watch' || kind === 'checkin';
const isComment = ({ kind }: SocialItem) => kind === 'comment' || kind === 'review';
const newestFirst = (a: SocialItem, b: SocialItem) => Date.parse(b.at) - Date.parse(a.at);
const watchedAt = ({ watches }: Bucket) => Date.parse(watches[0]?.at ?? '') || 0;

/**
 * A sitting's titles, the one order everything reads from: the ones they watched by their newest watch, then the rest
 * by their newest row. Rows come in newest first.
 */
function buckets(items: readonly SocialItem[]): readonly Bucket[] {
  const keys = [...new Set(items.map(({ title }) => title.key))];
  return keys.map((key) => {
    const rows = items.filter(({ title }) => title.key === key);
    return {
      title: rows[0]?.title ?? { key, name: '', href: '' },
      watches: rows.filter(isWatch),
      ratings: rows.filter(({ kind }) => kind === 'rating'),
      comments: rows.filter(isComment),
    };
  }).toSorted((a, b) => watchedAt(b) - watchedAt(a));
}

type Run = { readonly season: number; readonly from: number; readonly to: number };

const pad = (n: number) => String(n).padStart(2, '0');
const runLabel = ({ season, from, to }: Run) => {
  if (season === 0) return `Special ${from}`;
  return from === to ? `${season}x${pad(from)}` : `${season}x${pad(from)}–${season}x${pad(to)}`;
};

/** Episodes as runs: "1x06–1x08", "1x10". A repeat joins its run; specials stay one each. */
function ranges(items: readonly SocialItem[]): readonly string[] {
  const episodes = items.flatMap(({ episode }) => (episode ? [episode] : []))
    .toSorted((a, b) => a.season - b.season || a.number - b.number);
  const runs = episodes.reduce<readonly Run[]>((list, { season, number }) => {
    const last = list.at(-1);
    if (last && last.season === season && season > 0 && number - last.to <= 1) {
      return list.with(-1, { ...last, to: number });
    }
    if (last && last.season === season && last.to === number) return list;
    return [...list, { season, from: number, to: number }];
  }, []);
  return runs.map(runLabel);
}

const andJoin = (words: readonly string[]) =>
  words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;

function watchCount(watches: readonly SocialItem[]): string {
  const episodes = watches.filter(({ episode }) => episode).length;
  const movies = watches.length - episodes;
  return [episodes && countLabel(episodes, 'episode'), movies && countLabel(movies, 'movie')]
    .filter(Boolean).join(', ');
}

const watchedLabel = ({ title, watches }: Bucket) => {
  const runs = ranges(watches).join(', ');
  return runs ? `${title.name} ${runs}` : title.name;
};

function watchedText(watched: readonly Bucket[], watches: readonly SocialItem[]): string | null {
  const [only] = watched;
  if (!only) return null;
  if (watched.length > 1) {
    const shows = watched.filter(({ watches: rows }) => rows.some(({ episode }) => episode)).length;
    return `watched ${watchCount(watches).replace(', ', ' and ')}${shows > 1 ? ` across ${shows} shows` : ''}`;
  }

  const rows = only.watches;
  const verb = rows.length === 1 && rows[0]?.kind === 'checkin'
    ? 'checked in to'
    : rows.length >= 3
    ? 'binged'
    : 'watched';
  const runs = ranges(rows);
  const [run] = runs;
  // Two episodes in a row read as "1x07 and 1x08", not a range.
  const episodes = rows.length === 2 && runs.length === 1 && run?.includes('–')
    ? run.replace('–', ' and ')
    : andJoin(runs);
  return `${verb} ${only.title.name}${episodes ? ` ${episodes}` : ''}`;
}

/** The whole sitting as one sentence, which screen readers get instead of the headline and chips. */
function sentence(sitting: Sitting, all: readonly Bucket[]): string {
  const watched = all.filter(({ watches }) => watches.length > 0);
  const own = (bucket: Bucket) => watched.length === 1 && bucket.watches.length > 0;
  const target = (bucket: Bucket, item: SocialItem) => (own(bucket) ? 'it' : item.label);
  const rest = all.flatMap((bucket) => [
    ...bucket.ratings.map((item) => `rated ${target(bucket, item)} ${item.rating} out of 10`),
    ...bucket.comments.map((item) => `${item.kind === 'review' ? 'reviewed' : 'commented on'} ${target(bucket, item)}`),
  ]);
  const watchedPart = watchedText(watched, sitting.items.filter(isWatch));
  return `${sitting.member.name} ${andJoin([...(watchedPart ? [watchedPart] : []), ...rest])}.`;
}

function dayLabel(at: string, now: Date, datePreferences: DatePreferences): string {
  const { timeZone } = datePreferences;
  const days = Math.round(
    (Date.parse(dayIn(now.toISOString(), timeZone)) - Date.parse(dayIn(at, timeZone))) / 86_400_000,
  );
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return formatDate(at, { ...datePreferences, format: days < 7 ? 'dddd' : 'll' });
}

/** "+25 shows", "+1 movie", or "+2 more" when shows and movies mix. */
function moreLabel(rest: readonly Bucket[]): string | null {
  if (rest.length === 0) return null;
  const kinds = new Set(rest.map(({ title }) => title.key.split(':')[0]));
  const [kind] = kinds;
  return kinds.size === 1 && kind ? `+${countLabel(rest.length, kind)}` : `+${rest.length} more`;
}

/** The list button's label, or null when the headline and chips already show the whole sitting. */
function countOf(all: readonly Bucket[], watches: readonly SocialItem[]): string | null {
  if (watches.length > 1) {
    const shows = all.filter((bucket) => bucket.watches.some(({ episode }) => episode)).length;
    const episodes = watches.filter(({ episode }) => episode).length;
    return `${watchCount(watches)}${shows > 1 && shows !== episodes ? ` · ${countLabel(shows, 'show')}` : ''}`;
  }
  if (watches.length > 0) return null;

  const rows = all.flatMap(({ ratings, comments }) => [...ratings, ...comments]);
  if (rows.length < 3) return null;
  return (['rating', 'comment', 'review'] as const)
    .map((kind) => [kind, rows.filter((row) => row.kind === kind).length] as const)
    .flatMap(([kind, n]) => (n ? [countLabel(n, kind)] : []))
    .join(', ');
}

/** One line per title's watches, per rating and per comment, in the order of each one's newest row. */
function linesOf(items: readonly SocialItem[]): readonly SittingLine[] {
  const groupKey = (item: SocialItem) =>
    isWatch(item) ? `watch:${item.title.key}` : item.kind === 'rating' ? `rating:${item.title.key}` : item.key;
  const keys = [...new Set(items.map(groupKey))];
  return keys.flatMap((key) => {
    const rows = items.filter((item) => groupKey(item) === key);
    const [first] = rows;
    if (!first) return [];
    const codes = [...new Set(rows.flatMap(({ code }) => (code ? [code] : [])))].join(', ');
    return [{
      key,
      kind: first.kind,
      name: first.title.name,
      href: rows.length === 1 ? first.href : first.title.href,
      codes,
      rating: first.rating,
      at: first.at,
      time: first.time,
    }];
  });
}

/** Lines past this many fold behind a button, which takes the last line's place. */
const LINES = 8;
const POSTERS = 3;
const SPAN_MS = 2 * 3_600_000;

function listOf(items: readonly SocialItem[]): SittingSummary['list'] {
  const all = linesOf(items);
  const lines = all.length > LINES ? all.slice(0, LINES - 1) : all;
  const rest = all.slice(lines.length);
  if (rest.length === 0) return { lines, rest, more: null };
  const shows = rest.every(({ key }) => key.startsWith('watch:show:'));
  return { lines, rest, more: `Show ${rest.length} more${shows ? ' shows' : ''}` };
}

type DescribeSittingParams = { sitting: Sitting; now: Date; datePreferences: DatePreferences };

/** Sums a sitting up the title-first way: what was watched as the headline, and counts, hearts and comments. */
export function describeSitting({ sitting, now, datePreferences }: DescribeSittingParams): SittingSummary {
  const items = sitting.items.toSorted(newestFirst);
  const all = buckets(items);
  const watched = all.filter(({ watches }) => watches.length > 0);
  const unwatched = all.filter(({ watches }) => watches.length === 0);
  const watches = items.filter(isWatch);
  // The headline's titles: what they watched, else what they rated or commented on.
  const named = watched.length > 0 ? watched : all;
  const [lead] = named;
  const one = watched.length === 1 && lead;
  const firstRow = (bucket: Bucket) => bucket.watches[0] ?? bucket.ratings[0] ?? bucket.comments[0];

  const links: readonly Link[] = one
    ? [{ text: watchedLabel(lead), href: lead.title.href }]
    : named.slice(0, 2).map((bucket) => {
      const row = firstRow(bucket);
      return watched.length > 0 || !row
        ? { text: bucket.title.name, href: bucket.title.href }
        : { text: row.label, href: row.href };
    });
  const leadRow = lead && firstRow(lead);
  const count = countOf(all, watches);
  // Three or more ratings alone fold into the "4 ratings" button, and their hearts into its list.
  const folded = watches.length === 0 && count !== null;
  const posters = named.length > POSTERS ? named.slice(0, POSTERS - 1) : named;
  const [newest] = items;
  const oldest = items.at(-1);

  return {
    head: { links, more: moreLabel(named.slice(2)) },
    tile: {
      link: lead && leadRow
        ? { text: one ? watchedLabel(lead) : leadRow.label, href: one ? lead.title.href : leadRow.href }
        : null,
      more: moreLabel(named.slice(1)),
      still: { href: leadRow?.href ?? '', path: leadRow?.still },
      heart: lead?.ratings[0]?.rating ?? null,
    },
    count,
    // A sitting of ratings alone has them in its headline already, so its hearts need no names.
    hearts: folded
      ? []
      : (watched.length > 0
        ? watched.map(({ ratings }) => ratings.slice(0, 1))
        : unwatched.map(({ ratings }) => ratings))
        .flat().flatMap(({ rating }) => (rating ? [rating] : [])),
    rated: watched.length > 0
      ? unwatched.flatMap(({ title, ratings }) =>
        ratings.flatMap(({ rating }) => (rating ? [{ rating, name: title.name }] : []))
      )
      : [],
    comments: items.flatMap(({ comment, kind, label }) =>
      comment ? [{ id: comment.id, review: kind === 'review', on: label }] : []
    ),
    posters: { titles: posters.map(({ title }) => title), more: named.length - posters.length },
    list: listOf(items),
    span: newest && oldest && Date.parse(newest.at) - Date.parse(oldest.at) >= SPAN_MS
      ? `${oldest.time} – ${newest.time}`
      : null,
    sentence: sentence({ ...sitting, items }, all),
    day: dayLabel(sitting.newest, now, datePreferences),
    ago: shortAgo(sitting.newest, now),
    fresh: now.getTime() - Date.parse(sitting.newest) < 3_600_000,
  };
}
