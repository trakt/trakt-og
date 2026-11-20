import { describe, expect, it } from 'vitest';
import { dashboardPrefs } from './dashboardPrefs.ts';
import { toDashboardSettings } from './toDashboardSettings.ts';

const allHidden = Object.fromEntries(
  Object.entries(dashboardPrefs.defaults).map(([key, value]) => [key, typeof value === 'boolean' ? true : value]),
) as typeof dashboardPrefs.defaults;

describe('toDashboardSettings', () => {
  it("should use OG's defaults signed out or with nothing saved", () => {
    expect(toDashboardSettings({ settings: null })).toEqual({
      upNext: {
        sort: { by: 'added', how: 'asc', title: 'Activity Date' },
        favorites: 0,
        simpleProgress: false,
        includeWatchlisted: false,
        refresh: false,
        poster: 'show',
      },
      schedule: { filter: 'shows-movies', movies: 'all', startDay: 'today', poster: 'show' },
      recommendations: { type: 'media', release: 'out_now' },
      order: [
        'upNext',
        'schedule',
        'watchlist',
        'lastThirtyDays',
        'recentlyWatched',
        'watchingNow',
        'hotInNetwork',
        'socialFeed',
        'recommendations',
      ],
      hidden: {
        upNext: false,
        schedule: false,
        watchlist: false,
        lastThirtyDays: false,
        recentlyWatched: false,
        watchingNow: false,
        hotInNetwork: false,
        socialFeed: false,
        recommendations: false,
      },
    });
  });

  it('should read the Up Next and recommendation fields from /users/settings', () => {
    const settings = {
      browsing: {
        progress: {
          on_deck: { sort: 'completed', sort_how: 'desc', refresh: true, simple_progress: true, only_favorites: true },
          watched: { include_watchlisted: true },
        },
        watchnow: { favorites: ['us-netflix', 'us-hulu', 'us-max'] },
      },
    };

    const { upNext, recommendations } = toDashboardSettings({ settings });

    expect(upNext).toEqual({
      sort: { by: 'completed', how: 'desc', title: 'Completion %' },
      favorites: 3,
      simpleProgress: true,
      includeWatchlisted: true,
      refresh: true,
      poster: 'show',
    });
    expect(recommendations).toEqual({ type: 'media', release: 'out_now' });
  });

  it("should read the form's activity default and an unknown sort as Activity Date", () => {
    const sort = (value: string) =>
      toDashboardSettings({ settings: { browsing: { progress: { on_deck: { sort: value } } } } }).upNext.sort;

    expect(sort('activity')).toEqual({ by: 'added', how: 'asc', title: 'Activity Date' });
    expect(sort('nope').by).toBe('added');
  });

  it('should leave favorites only off without favorite services', () => {
    const settings = { browsing: { progress: { on_deck: { only_favorites: true } }, watchnow: { favorites: [] } } };

    expect(toDashboardSettings({ settings }).upNext.favorites).toBe(0);
  });

  it('should take the posters, filter and start day from the prefs', () => {
    const prefs = {
      ...dashboardPrefs.defaults,
      on_deck_poster: 'season',
      upcoming_filter: 'finales',
      upcoming_start_day: 'monday',
      upcoming_poster: 'season',
      upcoming_movies: 'none',
    } as const;

    const settings = toDashboardSettings({ settings: null, prefs });

    expect(settings.upNext.poster).toBe('season');
    expect(settings.schedule).toEqual({ filter: 'finales', movies: 'none', startDay: 'monday', poster: 'season' });
  });

  it("should take the recommendations' type from the prefs", () => {
    const prefs = { ...dashboardPrefs.defaults, recommendations_type: 'movie' } as const;

    expect(toDashboardSettings({ settings: null, prefs }).recommendations.type).toBe('movie');
  });

  it("should take the recommendations' release from the prefs", () => {
    const prefs = { ...dashboardPrefs.defaults, recommendations_release: 'coming_soon' } as const;

    expect(toDashboardSettings({ settings: null, prefs }).recommendations.release).toBe('coming_soon');
  });

  it('should hide every section for every member', () => {
    const settings = { user: { vip: false, joined_at: '2024-09-11T00:00:00.000Z' } };

    expect(Object.values(toDashboardSettings({ settings, prefs: allHidden }).hidden).every(Boolean)).toBe(true);
  });

  it("should take the panels' order from the prefs", () => {
    const prefs = dashboardPrefs.read(JSON.stringify({ me: { order: ['recommendations', 'upNext'] } }), 'me');

    expect(toDashboardSettings({ settings: null, prefs }).order).toEqual([
      'recommendations',
      'upNext',
      'schedule',
      'watchlist',
      'lastThirtyDays',
      'recentlyWatched',
      'watchingNow',
      'hotInNetwork',
      'socialFeed',
    ]);
  });

  it('should survive a malformed settings body', () => {
    const settings = { user: 'nope', browsing: { progress: { on_deck: { sort_how: 'sideways' } }, watchnow: 3 } };

    expect(toDashboardSettings({ settings }).upNext.sort).toEqual({ by: 'added', how: 'asc', title: 'Activity Date' });
  });
});
