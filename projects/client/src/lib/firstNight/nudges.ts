import type { OverlaySlices } from '../overlay/OverlaySlices.ts';
import { traktUrls } from '../traktUrls.ts';
import { FIRST_NIGHT_GOAL, trackedTitles } from './firstNight.ts';

/** The counts nudges watch for, from the overlay. */
export type NudgeCounts = {
  readonly watched: number;
  readonly tracked: number;
  readonly watchlisted: number;
  readonly rated: number;
  readonly favorited: number;
};

export type Nudge = {
  readonly key: 'first-watch' | 'services' | 'ratings' | 'favorites' | 'welcome-back';
  readonly when: string;
  readonly title: string;
  readonly text: string;
  readonly action: { readonly label: string; readonly href?: string; readonly external?: boolean };
};

/** Null until the overlay has the slices nudges count from. */
export function nudgeCounts(slices: Partial<OverlaySlices>): NudgeCounts | null {
  const tracked = trackedTitles(slices);
  if (tracked === null || !slices.watchedMovies || !slices.watchedShows || !slices.watchlist || !slices.ratings) {
    return null;
  }
  return {
    watched: slices.watchedMovies.size + slices.watchedShows.size,
    tracked,
    watchlisted: slices.watchlist.movie.size + slices.watchlist.show.size,
    rated: slices.ratings.movie.size + slices.ratings.show.size,
    favorited: (slices.favorites?.movie.size ?? 0) + (slices.favorites?.show.size ?? 0),
  };
}

type NextParams = {
  before: NudgeCounts;
  after: NudgeCounts;
  /** Whether the member picked any streaming services yet. */
  hasServices: boolean;
  slug: string;
};

const crossed = (before: number, after: number, at: number) => before < at && after >= at;

/** The nudge a change just earned, if any: only thresholds crossed while the member is here. */
export function nextNudge({ before, after, hasServices, slug }: NextParams): Nudge | null {
  if (crossed(before.watched, after.watched, 1)) {
    return {
      key: 'first-watch',
      when: 'Your first one',
      title: "That's one in the books.",
      text: `${FIRST_NIGHT_GOAL - 1} more and your dashboard lights up. Shows you mark line up in Up Next.`,
      action: { label: 'Keep going', href: '/dashboard' },
    };
  }
  if (!hasServices && crossed(before.watchlisted, after.watchlisted, 3)) {
    return {
      key: 'services',
      when: 'Three on your watchlist',
      title: 'Want to know where these stream?',
      text: 'Pick your services and Watch Now shows where each one plays.',
      action: { label: 'Pick services' },
    };
  }
  if (crossed(before.rated, after.rated, 5)) {
    return {
      key: 'ratings',
      when: 'Five ratings',
      title: 'Your picks just got personal.',
      text: "Recommendations learn from your ratings the next time they're worked out, usually overnight.",
      action: { label: 'See recommendations', href: '/shows/recommendations' },
    };
  }
  if (after.favorited === 0 && crossed(before.tracked, after.tracked, 25)) {
    return {
      key: 'favorites',
      when: '25 titles',
      title: 'Your profile is looking good.',
      text: 'Star your all-time favorites so people see them first.',
      action: { label: 'See my profile', href: `/users/${slug}` },
    };
  }
  return null;
}

/** On a later day's first visit. */
export function welcomeBack(firstName: string): Nudge {
  return {
    key: 'welcome-back',
    when: 'Welcome back',
    title: `Good to see you again, ${firstName}.`,
    text: 'Watched something since? The Trakt app and Plex can track it for you as you watch.',
    action: { label: 'Get the app', href: traktUrls.appStore, external: true },
  };
}

/** What this browser remembers: nudges already shown, and the last day the member visited. */
export type NudgeMemory = { readonly seen: readonly string[]; readonly lastVisit?: string };

const storageKey = (slug: string) => `og-nudges:${slug}`;

export const nudgeMemory = {
  read(slug: string): NudgeMemory {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey(slug)) ?? '{}');
      return { seen: Array.isArray(parsed.seen) ? parsed.seen : [], lastVisit: parsed.lastVisit };
    } catch {
      return { seen: [] };
    }
  },
  write(slug: string, memory: NudgeMemory) {
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(memory));
    } catch {
      // Without storage a nudge can show again next visit, which is harmless.
    }
  },
};
