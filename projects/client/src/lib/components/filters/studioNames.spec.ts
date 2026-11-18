import { describe, expect, it, vi } from 'vitest';
import type { StudioName } from './fetchStudios.ts';
import { studioNameCache } from './studioNames.svelte.ts';

const memoryStorage = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
  };
};

const a24: StudioName = { slug: 'a24', name: 'A24' };

describe('studioNameCache', () => {
  it('should know a remembered studio, and so should the next page load until it expires', () => {
    const storage = memoryStorage();
    let now = 0;
    studioNameCache(storage, () => now).remember([a24]);

    now = 29 * 60 * 1000;
    expect(studioNameCache(storage, () => now).name('a24')).toBe('A24');
    now = 31 * 60 * 1000;
    expect(studioNameCache(storage, () => now).name('a24')).toBeUndefined();
  });

  it('should look up only the slugs it has no name for, keeping the exact match', async () => {
    const cache = studioNameCache(memoryStorage());
    cache.remember([a24]);
    const search = vi.fn(async () => [
      { slug: 'neon-rated', name: 'Neon Rated' },
      { slug: 'neon', name: 'NEON' },
    ]);

    await cache.resolve(['a24', 'neon', 'neon'], search);

    expect(search).toHaveBeenCalledExactlyOnceWith('neon', 50);
    expect(cache.name('neon')).toBe('NEON');
    expect(cache.name('neon-rated')).toBeUndefined();
  });

  it('should ask once for a slug the search cannot match, or when the search fails', async () => {
    const cache = studioNameCache(memoryStorage());
    const search = vi.fn(async (query: string) => {
      if (query === 'gone') throw new Error('offline');
      return [];
    });

    await cache.resolve(['missing', 'gone'], search);
    await cache.resolve(['missing', 'gone'], search);

    expect(search).toHaveBeenCalledTimes(2);
    expect(cache.name('missing')).toBeUndefined();
  });

  it('should keep names for the page when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const cache = studioNameCache(blocked);
    cache.remember([a24]);

    expect(cache.name('a24')).toBe('A24');
  });
});
