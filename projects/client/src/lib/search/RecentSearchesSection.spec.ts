import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import RecentSearchesSection from './RecentSearchesSection.svelte';

const html = (terms: ReadonlyArray<{ query: string; type: string }>) =>
  render(RecentSearchesSection, {
    props: { terms, open: true, query: 'Dune', slug: 'movies', onremove: () => {}, onclear: () => {} },
  }).body;

describe('RecentSearchesSection', () => {
  it('should render nothing without recent searches', () => {
    const body = html([]);

    expect(body).not.toContain('Recent');
    expect(body).not.toContain('recent-clear-all');
    expect(body).not.toContain('no recent searches');
  });

  it('should link each search to its results and mark the current one', () => {
    const body = html([{ query: 'Dune', type: 'movies' }, { query: 'Tron Legacy', type: '' }]);

    expect(body).toContain('href="/search/movies?query=Dune" aria-current="page"');
    expect(body).toContain('href="/search?query=Tron%20Legacy"');
    expect(body).toContain('aria-label="Remove recent search: Tron Legacy"');
  });

  it('should offer a Clear all × that says what it clears', () => {
    const body = html([{ query: 'Dune', type: 'movies' }]);

    expect(body).toMatch(
      /<button type="button" class="[^"]*recent-clear-all[^"]*" aria-label="Clear all recent searches"/,
    );
  });
});
