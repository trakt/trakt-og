import { describe, expect, it } from 'vitest';
import { pageSitemapUrls } from './pageSitemapUrls.ts';

const paths = pageSitemapUrls.map(({ path }) => path);

describe('pageSitemapUrls', () => {
  it('should list the home, about and discover pages', () => {
    expect(paths.slice(0, 3)).toEqual(['/', '/about', '/discover']);
  });

  it('should list each chart, and each period of the period charts, for both types', () => {
    expect(paths).toContain('/movies/trending');
    expect(paths).toContain('/shows/anticipated');
    expect(paths).toContain('/shows/popular');
    expect(paths).toContain('/movies/favorited/daily');
    expect(paths).toContain('/shows/library/all');
    expect(paths).toContain('/movies/played/monthly');
    expect(paths).not.toContain('/movies/favorited');
  });

  it("should leave out the viewer's own recommendations", () => {
    expect(paths.some((path) => path.includes('recommendations'))).toBe(false);
  });

  it('should list box office and the public calendars, not the viewer calendars', () => {
    expect(paths).toContain('/movies/boxoffice');
    expect(paths).toContain('/calendars/premieres');
    expect(paths).toContain('/calendars/dvd');
    expect(paths.some((path) => path.startsWith('/calendars/my'))).toBe(false);
  });

  it('should list each page once, with no lastmod', () => {
    expect(new Set(paths).size).toBe(paths.length);
    expect(pageSitemapUrls.every(({ lastmod }) => lastmod === undefined)).toBe(true);
  });
});
