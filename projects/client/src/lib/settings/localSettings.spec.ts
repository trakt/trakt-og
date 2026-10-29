import { afterEach, describe, expect, it, vi } from 'vitest';
import { localSettings } from './localSettings.ts';

afterEach(() => vi.unstubAllGlobals());

const grid = { browsing: { progress: { watched: { grid_view: true } } } };

describe('localSettings', () => {
  it('should read nothing from a missing or unreadable cookie', () => {
    expect(localSettings.read(undefined)).toEqual({});
    expect(localSettings.read('{oops')).toEqual({});
    expect(localSettings.read('[1]')).toEqual({});
  });

  it('should lay a save over what it kept, key by key', () => {
    const kept = localSettings.write(undefined, grid);
    const next = localSettings.write(kept, { browsing: { progress: { watched: { simple_progress: true } } } });

    expect(JSON.parse(next)).toEqual({
      browsing: { progress: { watched: { grid_view: true, simple_progress: true } } },
    });
  });

  it('should keep display settings only', () => {
    expect(localSettings.keeps(grid)).toBe(true);
    expect(localSettings.keeps({ account: { time_24hr: true } })).toBe(true);
    expect(localSettings.keeps({ user: { name: 'Sean' } })).toBe(false);
    expect(localSettings.keeps({ browsing: {}, user: { name: 'Sean' } })).toBe(false);
    expect(localSettings.keeps({})).toBe(false);
  });

  it("should lay the kept settings over the API's, replacing lists whole", () => {
    const api = {
      user: { username: 'sean' },
      browsing: {
        dark_knight: 'false',
        genres: { favorites: ['drama', 'comedy'] },
        progress: { watched: { grid_view: false, sort: 'title' } },
      },
    };
    const kept = localSettings.write(undefined, { browsing: { ...grid.browsing, genres: { favorites: ['anime'] } } });

    expect(localSettings.apply(api, kept)).toEqual({
      user: { username: 'sean' },
      browsing: {
        dark_knight: 'false',
        genres: { favorites: ['anime'] },
        progress: { watched: { grid_view: true, sort: 'title' } },
      },
    });
    expect(localSettings.apply(api, undefined)).toEqual(api);
  });

  it('should save to and clear the browser cookie', () => {
    const jar = { cookie: '' };
    vi.stubGlobal('document', jar);
    vi.stubGlobal('location', { protocol: 'https:' });

    localSettings.save(grid);
    expect(jar.cookie).toBe(
      `og-local-settings=${encodeURIComponent(JSON.stringify(grid))}; path=/; samesite=lax; max-age=34560000; secure`,
    );

    localSettings.clear();
    expect(jar.cookie).toBe('og-local-settings=; path=/; samesite=lax; max-age=0; secure');
  });
});
