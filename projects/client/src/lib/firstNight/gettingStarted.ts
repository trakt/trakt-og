import type { OverlaySlices } from '../overlay/OverlaySlices.ts';
import { traktUrls } from '../traktUrls.ts';
import { FIRST_NIGHT_GOAL, trackedTitles } from './firstNight.ts';

/** One ticket in the getting-started book. Done comes from the member's own data, never from a tick box. */
export type StartStep = {
  readonly key: 'pilot' | 'name' | 'watchlist' | 'ratings' | 'apps' | 'follows';
  /** The ticket's name, a film-night role. */
  readonly name: string;
  /** What to do, plainly. */
  readonly text: string;
  readonly done: boolean;
  /** What its button says on the profile's credits. */
  readonly action: string;
  readonly href: string;
  readonly external?: boolean;
};

/** The book shows for a member's first 30 days. */
const RECENT_DAYS = 30;
const DAY = 86_400_000;

export const isRecentMember = (joinedAt: string | null | undefined, now = Date.now()) =>
  !!joinedAt && now - Date.parse(joinedAt) < RECENT_DAYS * DAY;

/**
 * Local to this browser: whether the member hid the book, skipped the profile's tickets, and opened the apps step.
 */
export type StartMarks = { readonly hidden?: boolean; readonly heroHidden?: boolean; readonly apps?: boolean };

const key = (slug: string) => `og-getting-started:${slug}`;

export const startMarks = {
  read(slug: string): StartMarks {
    try {
      return JSON.parse(localStorage.getItem(key(slug)) ?? '{}') as StartMarks;
    } catch {
      return {};
    }
  },
  write(slug: string, marks: StartMarks) {
    try {
      localStorage.setItem(key(slug), JSON.stringify(marks));
    } catch {
      // Private windows can refuse storage; the book just shows again next time.
    }
  },
};

type StepsParams = {
  slices: Partial<OverlaySlices>;
  slug: string;
  named: boolean;
  marks: StartMarks;
};

/** The six tickets, or null until the overlay has loaded enough to say which are done. */
export function gettingStartedSteps({ slices, slug, named, marks }: StepsParams): StartStep[] | null {
  const tracked = trackedTitles(slices);
  if (tracked === null || !slices.watchlist || !slices.ratings || !slices.network) return null;
  const watchlisted = slices.watchlist.movie.size + slices.watchlist.show.size;
  const rated = slices.ratings.movie.size + slices.ratings.show.size;

  return [
    {
      key: 'name',
      name: 'Name in Lights',
      text: 'Tell us what to call you',
      done: named,
      action: 'Save',
      href: `/users/${slug}`,
    },
    {
      key: 'pilot',
      name: 'The Pilot',
      text: `Track ${FIRST_NIGHT_GOAL} shows or movies`,
      done: tracked >= FIRST_NIGHT_GOAL,
      action: 'What have you seen?',
      href: '/dashboard',
    },
    {
      key: 'watchlist',
      name: 'Coming Attractions',
      text: 'Add 5 to your watchlist',
      done: watchlisted >= 5,
      action: 'Find something to watch',
      href: '/movies/anticipated',
    },
    {
      key: 'ratings',
      name: "Critic's Corner",
      text: 'Rate 5 shows or movies',
      done: rated >= 5,
      action: "Rate what you've seen",
      href: `/users/${slug}/history`,
    },
    {
      key: 'apps',
      name: 'Remote Control',
      text: 'Get the app or connect Plex',
      done: !!marks.apps,
      action: 'Get the app',
      href: traktUrls.syncSettings,
      external: true,
    },
    {
      key: 'follows',
      name: 'Movie Buddies',
      text: 'Follow 3 people',
      done: slices.network.following.size >= 3,
      action: 'Find people',
      href: `/users/${slug}/network`,
    },
  ];
}
