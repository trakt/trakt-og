import { z } from 'zod/v4';
import type { DashboardSettings } from './DashboardSettings.ts';
import { type DashboardPrefs, dashboardPrefs } from './dashboardPrefs.ts';
import { upNextSorts } from './upNextSorts.ts';

// `/users/settings` is API, so only the fields the dashboard reads are parsed, each on its own.
const schema = z.object({
  browsing: z
    .object({
      progress: z
        .object({
          on_deck: z
            .object({
              sort: z.string().nullish().catch(null),
              sort_how: z.enum(['asc', 'desc']).nullish().catch(null),
              refresh: z.boolean().nullish().catch(null),
              simple_progress: z.boolean().nullish().catch(null),
              only_favorites: z.boolean().nullish().catch(null),
            })
            .nullish()
            .catch(null),
          watched: z
            .object({ include_watchlisted: z.boolean().nullish().catch(null) })
            .nullish()
            .catch(null),
        })
        .nullish()
        .catch(null),
      watchnow: z
        .object({ favorites: z.array(z.string()).nullish().catch(null) })
        .nullish()
        .catch(null),
    })
    .nullish()
    .catch(null),
});

type ToDashboardSettingsParams = {
  /** The layout's `/users/settings`, or null signed out. */
  settings: unknown;
  prefs?: DashboardPrefs;
};

// The progress service treats the form's `activity` default as `added`.
function upNextSort(sort: string | null | undefined, how: 'asc' | 'desc' | null | undefined) {
  const by = sort === 'activity' ? 'added' : sort;
  const found = upNextSorts.find((option) => option.by === by) ?? upNextSorts[0];
  return { by: found.by, how: how ?? 'asc', title: found.title } as const;
}

/**
 * The dashboard's settings from `/users/settings` and the per-browser prefs, with OG's defaults for
 * anything unset. Every member can hide and reorder every panel; OG kept most switches for VIPs.
 */
export function toDashboardSettings({
  settings,
  prefs = dashboardPrefs.defaults,
}: ToDashboardSettingsParams): DashboardSettings {
  const parsed = schema.safeParse(settings ?? {});
  const { browsing } = parsed.success ? parsed.data : {};
  const onDeck = browsing?.progress?.on_deck;
  const favorites = onDeck?.only_favorites ? (browsing?.watchnow?.favorites?.length ?? 0) : 0;

  return {
    upNext: {
      sort: upNextSort(onDeck?.sort, onDeck?.sort_how),
      favorites,
      simpleProgress: onDeck?.simple_progress === true,
      includeWatchlisted: browsing?.progress?.watched?.include_watchlisted === true,
      refresh: onDeck?.refresh === true,
      poster: prefs.on_deck_poster,
    },
    schedule: {
      filter: prefs.upcoming_filter,
      movies: prefs.upcoming_movies,
      startDay: prefs.upcoming_start_day,
      poster: prefs.upcoming_poster,
    },
    watchlist: { sort: prefs.watchlist_sort, hide: prefs.watchlist_hide },
    recommendations: { type: prefs.recommendations_type, release: prefs.recommendations_release },
    ...dashboardPrefs.layoutOf(prefs),
  };
}
