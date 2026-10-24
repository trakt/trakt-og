import { describe, expect, it } from 'vitest';
import { createRecentSearches } from './createRecentSearches.svelte.ts';

const key = 'og-recent-searches:one';
const storage = (saved?: unknown) => {
  const values = new Map<string, string>(saved === undefined ? [] : [[key, JSON.stringify(saved)]]);
  return {
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => void values.set(name, value),
    removeItem: (name: string) => void values.delete(name),
    saved: () => JSON.parse(values.get(key) ?? 'null'),
  };
};
const broken = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
};

describe('createRecentSearches', () => {
  it('should start empty with nothing saved', () => {
    expect(createRecentSearches({ key, storage: storage() }).terms).toEqual([]);
  });

  it('should keep the newest search first and save it', () => {
    const saved = storage();
    const recent = createRecentSearches({ key, storage: saved });
    recent.record({ query: 'Breaking Bad', type: 'shows' });
    recent.record({ query: ' Tron ', type: '' });

    expect(recent.terms).toEqual([
      { query: 'Tron', type: '' },
      { query: 'Breaking Bad', type: 'shows' },
    ]);
    expect(saved.saved()).toEqual(recent.terms);
    expect(createRecentSearches({ key, storage: saved }).terms).toEqual(recent.terms);
  });

  it('should keep only the last five searches', () => {
    const recent = createRecentSearches({ key, storage: storage() });
    ['one', 'two', 'three', 'four', 'five', 'six'].forEach((query) => recent.record({ query, type: '' }));

    expect(recent.terms.map((term) => term.query)).toEqual(['six', 'five', 'four', 'three', 'two']);
  });

  it('should move a repeated search to the top instead of adding it twice', () => {
    const recent = createRecentSearches({ key, storage: storage() });
    recent.record({ query: 'tron', type: '' });
    recent.record({ query: 'Dune', type: 'movies' });
    recent.record({ query: 'TRON', type: '' });

    expect(recent.terms).toEqual([
      { query: 'TRON', type: '' },
      { query: 'Dune', type: 'movies' },
    ]);
  });

  it('should keep the same query in different search types apart', () => {
    const recent = createRecentSearches({ key, storage: storage() });
    recent.record({ query: 'Dune', type: 'movies' });
    recent.record({ query: 'Dune', type: 'shows' });

    expect(recent.terms).toHaveLength(2);
  });

  it('should ignore a blank search', () => {
    const recent = createRecentSearches({ key, storage: storage() });
    recent.record({ query: '   ', type: '' });

    expect(recent.terms).toEqual([]);
  });

  it('should remove one search', () => {
    const saved = storage([
      { query: 'Dune', type: 'movies' },
      { query: 'Tron', type: '' },
    ]);
    const recent = createRecentSearches({ key, storage: saved });
    recent.remove({ query: 'dune', type: 'movies' });

    expect(recent.terms).toEqual([{ query: 'Tron', type: '' }]);
    expect(saved.saved()).toEqual([{ query: 'Tron', type: '' }]);
  });

  it('should clear every search and its saved copy', () => {
    const saved = storage([{ query: 'Dune', type: 'movies' }]);
    const recent = createRecentSearches({ key, storage: saved });
    recent.clear();

    expect(recent.terms).toEqual([]);
    expect(saved.saved()).toBeNull();
  });

  it('should start empty from a corrupt saved copy and overwrite it', () => {
    const saved = storage();
    saved.setItem(key, '{not json');
    const recent = createRecentSearches({ key, storage: saved });
    expect(recent.terms).toEqual([]);

    recent.record({ query: 'Dune', type: 'movies' });
    expect(saved.saved()).toEqual([{ query: 'Dune', type: 'movies' }]);
  });

  it('should drop saved entries that are not searches and tidy the rest', () => {
    const recent = createRecentSearches({
      key,
      storage: storage([
        { query: 'Dune', type: null, created_at: 100 },
        { query: '' },
        'tron',
        { type: 'shows' },
        { query: 'dune' },
        { query: 'Alien', type: 'movies' },
      ]),
    });

    expect(recent.terms).toEqual([
      { query: 'Dune', type: '' },
      { query: 'Alien', type: 'movies' },
    ]);
  });

  it('should start empty when the saved copy is not a list', () => {
    expect(createRecentSearches({ key, storage: storage({ query: 'Dune' }) }).terms).toEqual([]);
  });

  it('should keep working in memory when storage fails or is missing', () => {
    [broken, undefined].forEach((unavailable) => {
      const recent = createRecentSearches({ key, storage: unavailable });
      recent.record({ query: 'Dune', type: 'movies' });
      recent.record({ query: 'Tron', type: '' });
      recent.remove({ query: 'Dune', type: 'movies' });

      expect(recent.terms).toEqual([{ query: 'Tron', type: '' }]);
      recent.clear();
      expect(recent.terms).toEqual([]);
    });
  });

  it('should build on what another tab saved', () => {
    const saved = storage();
    const here = createRecentSearches({ key, storage: saved });
    const there = createRecentSearches({ key, storage: saved });
    there.record({ query: 'Dune', type: 'movies' });
    here.record({ query: 'Tron', type: '' });

    expect(here.terms).toEqual([
      { query: 'Tron', type: '' },
      { query: 'Dune', type: 'movies' },
    ]);
  });

  it('should pick up a change from another tab on reload', () => {
    const saved = storage();
    const here = createRecentSearches({ key, storage: saved });
    createRecentSearches({ key, storage: saved }).record({ query: 'Dune', type: 'movies' });
    here.reload();

    expect(here.terms).toEqual([{ query: 'Dune', type: 'movies' }]);
  });
});
