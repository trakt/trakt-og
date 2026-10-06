import type { ProfileResponse } from '@trakt/api';
import { RATING_LABELS } from '../components/rating/ratingPrompt.ts';
import type { SocialRow } from './SocialRow.ts';

// OG's avatar for private members and members without one.
const PLACEHOLDER_AVATAR = 'https://media.trakt.tv/hotlink-ok/placeholders/medium/zoidberg.png';

export type ActivityUser = {
  readonly key: string;
  /** The tooltip's first line, OG's `user.username`. */
  readonly name: string;
  /** Left out for private members, whose placeholder avatar isn't a link. */
  readonly href?: string;
  readonly avatar: string;
  /** Their rating of the item, 1 to 10: the ring colour and the corner badge. */
  readonly rating?: number;
  /** "3 plays" under the name in the watched tab's tooltip. */
  readonly plays?: number;
  /** Shows only: how much of the show they've watched, as a whole percentage ("82% watched"). */
  readonly progress?: number;
};

/** One stop on the rating line: a rating, or a range of plays, with the followed members who landed on it. */
export type ActivitySection = {
  readonly key: string;
  /** "10", a plays range like "4–5", or a share of a show like "50–89%". */
  readonly label: string;
  /** OG's rating name ("Totally Ninja!"), or the range's name ("Deep in it"). */
  readonly name: string;
  /** The tooltip's and the opened stop's title: "10 · Totally Ninja!", "50–89% watched · Deep in it". */
  readonly title: string;
  /** The rating, or the range's step from 1 up: picks the colour. */
  readonly level: number;
  readonly users: readonly ActivityUser[];
  /** Its share of the tab's members, as a whole percentage. */
  readonly share: number;
};

type TabText = readonly [string, string];

export type ActivityTab =
  | {
    readonly id: 'watching';
    /** Everyone watching right now. */
    readonly number: string;
    readonly text: TabText;
    /** Watching now and followed by the viewer: first, each on their own. */
    readonly followed: readonly ActivityUser[];
    /** Everyone else watching now. */
    readonly others: readonly ActivityUser[];
  }
  | {
    readonly id: 'watched' | 'rated';
    /** A count, or the average rating's percentage (no sign) for "Rated by". */
    readonly number: string;
    readonly text: TabText;
    /** "Rated by" only: the average's rating level, 1 to 10, which colours the heart before the percentage. */
    readonly heart?: number;
    /** Every stop on the line, the empty ones too. */
    readonly sections: readonly ActivitySection[];
  };

type ToActivityParams = {
  /** `/:type/:id/watching`: everyone watching right now. */
  watching: readonly ProfileResponse[];
  /** `/:type/:id/social`: the followed members' activity, or `null` when logged out. */
  social: readonly SocialRow[] | null;
  /** The slugs the viewer follows, or `null` when logged out. */
  following: ReadonlySet<string> | null;
  /** A show's size, which turns People Watched into how much of it each member has seen. Movies and episodes count plays. */
  show?: { readonly airedEpisodes: number; readonly totalRuntime?: number };
};

const count = (value: number) => value.toLocaleString('en-US');
const people = (value: number) => (value === 1 ? 'Person' : 'People');

type Range = { readonly min: number; readonly max: number; readonly label: string; readonly name: string };

/** People Watched for a movie or an episode: how many times each member watched it. Named in OG's playful spirit. */
const PLAY_RANGES: readonly Range[] = [
  { min: 1, max: 1, label: '1', name: 'One and done' },
  { min: 2, max: 2, label: '2', name: 'Round two' },
  { min: 3, max: 3, label: '3', name: 'Hat trick' },
  { min: 4, max: 5, label: '4–5', name: "Can't stop" },
  { min: 6, max: 9, label: '6–9', name: 'Comfort watch' },
  { min: 10, max: Infinity, label: '10+', name: 'Knows every line' },
];

/** People Watched for a show: how much of it each member has seen, as a percentage. Past 100% is rewatching. */
const SHOW_RANGES: readonly Range[] = [
  { min: 0, max: 9, label: '<10%', name: 'Dipped a toe' },
  { min: 10, max: 49, label: '10–49%', name: 'Getting hooked' },
  { min: 50, max: 89, label: '50–89%', name: 'Deep in it' },
  { min: 90, max: 149, label: '90–149%', name: 'All caught up' },
  { min: 150, max: 299, label: '150–299%', name: 'Back for more' },
  { min: 300, max: Infinity, label: '300%+', name: 'Lives there' },
];

const RATINGS = Array.from({ length: 10 }, (_, index) => index + 1);

// A `/watching` profile or a `/social` row's member.
type Member = {
  readonly username: string;
  readonly private?: boolean | null;
  readonly ids: { readonly slug?: string | null };
  readonly images?: { readonly avatar?: { readonly full?: string | null } | null } | null;
};

function toUser(user: Member, index: number): ActivityUser {
  const slug = user.ids.slug;
  if (user.private || !slug) return { key: `private-${index}`, name: user.username, avatar: PLACEHOLDER_AVATAR };
  return {
    key: slug,
    name: user.username,
    href: `/users/${slug}`,
    avatar: user.images?.avatar?.full ?? PLACEHOLDER_AVATAR,
  };
}

const ratingOf = (row: SocialRow) => row.watched?.rating?.rating;
const share = (part: number, whole: number) => Math.round((part / (whole || 1)) * 100);

/**
 * How much of the show a member has seen: their minutes over every aired episode's, which weighs long and short
 * episodes fairly, or their plays over the aired episodes when either runtime is missing.
 */
function progressOf(row: SocialRow, show: NonNullable<ToActivityParams['show']>): number {
  const minutes = row.watched?.minutes_watched ?? 0;
  if (minutes > 0 && show.totalRuntime) return Math.floor((minutes / show.totalRuntime) * 100);
  return Math.floor(((row.watched?.plays ?? 0) / show.airedEpisodes) * 100);
}

function watchingTab(watching: readonly ProfileResponse[], following: ReadonlySet<string> | null) {
  if (watching.length === 0) return null;

  const isFollowed = (profile: ProfileResponse) => !profile.private && following?.has(profile.ids.slug ?? '') === true;
  const users = watching.map((profile, index) => ({ profile, user: toUser(profile, index) }));
  const followed = users.filter(({ profile }) => isFollowed(profile)).map(({ user }) => user);
  const others = users.filter(({ profile }) => !isFollowed(profile)).map(({ user }) => user);
  const text: TabText = followed.length > 0
    ? ['Watching Now', `${count(followed.length)} You Follow`]
    : ['Watching', 'Now'];
  return { id: 'watching', number: count(watching.length), text, followed, others } as const;
}

/**
 * OG's "People You Follow" tabs, with the followed members placed on a line. Watching Now counts everyone, followed
 * members first. People Watched spreads the followed members over ranges of plays for a movie or an episode, or of
 * how much they've seen for a show; Rated by over the ratings 1 to 10. Every stop is kept, so a line reads the same
 * on every title of its kind. Tabs without anyone are left out, and no tabs at all
 * means no section. `cut:` In Library, since `/social` has no collections.
 */
export function toActivity({ watching, social, following, show }: ToActivityParams): readonly ActivityTab[] {
  const watchers = (social ?? [])
    .filter((row) => row.watched)
    .toSorted((a, b) => (b.watched?.plays ?? 0) - (a.watched?.plays ?? 0));
  const raters = watchers.filter((row) => ratingOf(row) !== undefined);
  const withDetails = (row: SocialRow, index: number) => ({
    ...toUser(row.user, index),
    rating: ratingOf(row),
    plays: row.watched?.plays,
    progress: show ? progressOf(row, show) : undefined,
  });

  // A show sorts its watchers by how much they've seen, a movie or an episode by plays.
  const ranges = show ? SHOW_RANGES : PLAY_RANGES;
  const measure = (user: ActivityUser) => (show ? user.progress : user.plays) ?? 0;
  const titleOf = (range: Range) =>
    show
      ? `${range.label} watched · ${range.name}`
      : `${range.label} ${range.label === '1' ? 'play' : 'plays'} · ${range.name}`;
  const watchedSections = ranges.map((range, index) => {
    const users = watchers.map(withDetails).filter((user) => measure(user) >= range.min && measure(user) <= range.max);
    return {
      key: range.label,
      label: range.label,
      name: range.name,
      title: titleOf(range),
      level: index + 1,
      users,
      share: share(users.length, watchers.length),
    };
  });
  const ratingSections = RATINGS.map((rating) => {
    const users = raters.map(withDetails).filter((user) => user.rating === rating);
    const name = RATING_LABELS[rating] ?? '';
    return {
      key: String(rating),
      label: String(rating),
      name,
      title: `${rating} · ${name}`,
      level: rating,
      users,
      share: share(users.length, raters.length),
    };
  });

  const average = raters.reduce((sum, row) => sum + (ratingOf(row) ?? 0), 0) / (raters.length || 1);
  const tabs: readonly (ActivityTab | null)[] = [
    watchingTab(watching, following),
    watchers.length > 0
      ? {
        id: 'watched',
        number: count(watchers.length),
        text: [people(watchers.length), 'Watched'],
        sections: watchedSections,
      }
      : null,
    raters.length > 0
      ? {
        id: 'rated',
        // API's percentage truncates: 7.99 is 79%.
        number: String(Math.trunc(average * 10)),
        text: ['Rated by', `${count(raters.length)} ${people(raters.length)}`],
        heart: Math.min(Math.max(Math.trunc(average), 1), 10),
        sections: ratingSections,
      }
      : null,
  ];
  return tabs.filter((tab) => tab !== null);
}
