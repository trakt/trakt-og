import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { viewerRecentSearches } from './viewerRecentSearches.ts';

const environment = vi.hoisted(() => ({ browser: true }));
vi.mock('$app/environment', () => environment);

const listeners = new EventTarget();
beforeAll(() => {
  vi.stubGlobal('addEventListener', listeners.addEventListener.bind(listeners));
});
afterAll(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('viewerRecentSearches', () => {
  it('should share one list between the header and the search page', () => {
    const header = viewerRecentSearches('shared');
    const sidebar = viewerRecentSearches('shared');
    header.record({ query: 'Dune', type: 'movies' });
    expect(sidebar.terms).toEqual([{ query: 'Dune', type: 'movies' }]);

    sidebar.clear();
    expect(header.terms).toEqual([]);
  });

  it('should keep each account its own list in localStorage', () => {
    viewerRecentSearches('one').record({ query: 'Dune', type: 'movies' });

    expect(viewerRecentSearches('two').terms).toEqual([]);
    expect(JSON.parse(localStorage.getItem('og-recent-searches:one') ?? '[]')).toEqual([
      { query: 'Dune', type: 'movies' },
    ]);
  });

  it("should follow another tab's changes", () => {
    const recent = viewerRecentSearches('tabs');
    localStorage.setItem('og-recent-searches:tabs', JSON.stringify([{ query: 'Tron', type: '' }]));
    listeners.dispatchEvent(Object.assign(new Event('storage'), { key: 'og-recent-searches:tabs' }));

    expect(recent.terms).toEqual([{ query: 'Tron', type: '' }]);
  });

  it('should be empty and unshared on the server', () => {
    environment.browser = false;
    viewerRecentSearches('server').record({ query: 'Dune', type: 'movies' });

    expect(viewerRecentSearches('server').terms).toEqual([]);
    expect(localStorage.getItem('og-recent-searches:server')).toBeNull();
    environment.browser = true;
  });
});
