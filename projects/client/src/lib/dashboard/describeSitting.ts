import { dayIn } from '../calendars/calendarDays.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { countLabel } from '../utils/countLabel.ts';
import { formatDate } from '../utils/formatDate.ts';
import type { Sitting } from './groupSittings.ts';
import { shortAgo } from './shortAgo.ts';
import type { SocialItem } from './toSocialItem.ts';

type Link = { readonly text: string; readonly href: string };

/** A sitting as the panel writes it: title first, with the rest as chips, and the full sentence for screen readers. */
export type SittingSummary = {
  /** A row's headline: up to two titles ("Saved by the Bell, Raising Hope"), or one with its episodes. */
  readonly head: { readonly links: readonly Link[]; readonly more: number };
  /** "3 episodes", "2 episodes, 1 movie": set when there was more than one watch. */
  readonly count: string | null;
  /** Ratings of titles they watched in the sitting. */
  readonly hearts: readonly number[];
  /** Ratings of titles they didn't watch in it. */
  readonly rated: readonly { readonly rating: number; readonly name: string }[];
  /** Each comment or review, and what it was on: "Lioness 3x02". */
  readonly comments: readonly { readonly id: number; readonly review: boolean; readonly on: string }[];
  /** Up to three different titles or episodes to show as stills. */
  readonly thumbs: readonly SocialItem[];
  /** "Kristin binged Lanterns 1x06–1x08 and rated it 10 out of 10." */
  readonly sentence: string;
  /** "Today", "Yesterday", "Friday", in the viewer's zone. */
  readonly day: string;
  /** Since the newest row: "24m", "15h", "2d". */
  readonly ago: string;
};

type Bucket = {
  readonly title: SocialItem['title'];
  readonly watches: readonly SocialItem[];
  readonly ratings: readonly SocialItem[];
  readonly comments: readonly SocialItem[];
};

const isWatch = ({ kind }: SocialItem) => kind === 'watch' || kind === 'checkin';
const isComment = ({ kind }: SocialItem) => kind === 'comment' || kind === 'review';

/** A sitting's rows by title, in the order each title first shows up. */
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
  });
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

const THUMBS = 3;

type DescribeSittingParams = { sitting: Sitting; now: Date; datePreferences: DatePreferences };

/** Sums a sitting up the title-first way: what was watched as the headline, and counts, hearts and comments. */
export function describeSitting({ sitting, now, datePreferences }: DescribeSittingParams): SittingSummary {
  const all = buckets(sitting.items);
  const watched = all.filter(({ watches }) => watches.length > 0);
  const unwatched = all.filter(({ watches }) => watches.length === 0);
  const watches = sitting.items.filter(isWatch);
  const [first] = watched;

  const links: readonly Link[] = watched.length === 1 && first
    ? [{ text: watchedLabel(first), href: first.title.href }]
    : watched.length > 0
    ? watched.slice(0, 2).map(({ title }) => ({ text: title.name, href: title.href }))
    : unwatched.flatMap(({ ratings, comments }) =>
      [...ratings, ...comments].map(({ label, href }) => ({ text: label, href }))
    );

  return {
    head: { links, more: Math.max(watched.length - 2, 0) },
    count: watches.length > 1 ? watchCount(watches) : null,
    // A sitting of ratings alone has them in its headline already, so its hearts need no names.
    hearts: (first ? watched.map(({ ratings }) => ratings.slice(0, 1)) : unwatched.map(({ ratings }) => ratings))
      .flat().flatMap(({ rating }) => (rating ? [rating] : [])),
    rated: first
      ? unwatched.flatMap(({ title, ratings }) =>
        ratings.flatMap(({ rating }) => (rating ? [{ rating, name: title.name }] : []))
      )
      : [],
    comments: sitting.items.flatMap(({ comment, kind, label }) =>
      comment ? [{ id: comment.id, review: kind === 'review', on: label }] : []
    ),
    thumbs: sitting.items.filter((item, i, items) => items.findIndex(({ label }) => label === item.label) === i)
      .slice(0, THUMBS),
    sentence: sentence(sitting, all),
    day: dayLabel(sitting.newest, now, datePreferences),
    ago: shortAgo(sitting.newest, now),
  };
}
