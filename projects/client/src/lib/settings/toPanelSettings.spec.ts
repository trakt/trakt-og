import { describe, expect, it } from 'vitest';
import { toPanelSettings } from './toPanelSettings.ts';

describe('toPanelSettings', () => {
  it('should fill the profile defaults for missing or null preferences', () => {
    const { profile } = toPanelSettings({ browsing: { profile: { favorites: null } } });
    expect(profile.favorites).toEqual({ sort_by: 'random', sort_how: 'asc' });
    expect(profile.most_watched_shows).toEqual({ sort_by: 'plays', tab: 'last_30_days' });
    expect(profile.most_watched_movies.sort_by).toBe('time');
  });

  it('should keep saved choices and replace unknown ones with the default', () => {
    const { profile } = toPanelSettings({
      browsing: {
        profile: { most_watched_shows: { sort_by: 'time', tab: 'all_time' }, favorites: { sort_how: 'up' } },
      },
    });
    expect(profile.most_watched_shows).toEqual({ sort_by: 'time', tab: 'all_time' });
    expect(profile.favorites.sort_how).toBe('asc');
  });

  it('should fall back to every default when the response has no browsing settings', () => {
    expect(toPanelSettings(null)).toEqual(toPanelSettings({ browsing: {} }));
  });
});
