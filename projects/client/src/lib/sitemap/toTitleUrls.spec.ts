import { describe, expect, it } from 'vitest';
import { toTitleUrls } from './toTitleUrls.ts';

const title = (slug: string, updated_at?: string | null) => ({ ids: { slug }, updated_at });

describe('mapper: toTitleUrls', () => {
  it("should date each page by the title's updated_at", () => {
    expect(toTitleUrls('movies', [title('tron-1982', '2026-10-26T08:05:55.000Z')])).toEqual([
      { path: '/movies/tron-1982', lastmod: '2026-10-26T08:05:55Z' },
    ]);
  });

  it('should leave the date out when the API sent none', () => {
    expect(toTitleUrls('shows', [title('severance', null)])).toEqual([
      { path: '/shows/severance', lastmod: undefined },
    ]);
  });

  it('should keep the first of each slug, in order', () => {
    const urls = toTitleUrls('shows', [title('a', '2026-01-01T00:00:00Z'), title('b'), title('a')]);

    expect(urls.map(({ path }) => path)).toEqual(['/shows/a', '/shows/b']);
  });

  it('should list at most 2,000 titles', () => {
    const titles = Array.from({ length: 2500 }, (_, i) => title(`title-${i}`));

    expect(toTitleUrls('movies', titles)).toHaveLength(2000);
  });
});
