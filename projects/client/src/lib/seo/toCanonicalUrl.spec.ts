import { describe, expect, it } from 'vitest';
import { toCanonicalUrl } from './toCanonicalUrl.ts';

const canonical = (href: string, path?: string) => toCanonicalUrl({ url: new URL(href), path });

describe('seo: toCanonicalUrl', () => {
  it('should point at the production origin, even on a preview host', () => {
    expect(canonical('https://abc123.og-preview.workers.dev/movies/inception-2010')).toBe(
      'https://og.trakt.tv/movies/inception-2010',
    );
    expect(canonical('http://localhost:5173/')).toBe('https://og.trakt.tv/');
  });

  it('should drop filters, sorts, view toggles, share and tracking parameters', () => {
    expect(
      canonical(
        'https://og.trakt.tv/shows/trending?genres=drama&sort=votes&view=list&share=1&utm_source=x&utm_medium=y&fbclid=z',
      ),
    ).toBe('https://og.trakt.tv/shows/trending');
  });

  it('should keep a page past the first', () => {
    expect(canonical('https://og.trakt.tv/movies/popular?page=3&genres=drama')).toBe(
      'https://og.trakt.tv/movies/popular?page=3',
    );
    expect(canonical('https://og.trakt.tv/movies/popular?page=1')).toBe('https://og.trakt.tv/movies/popular');
    expect(canonical('https://og.trakt.tv/movies/popular?page=abc')).toBe('https://og.trakt.tv/movies/popular');
  });

  it('should drop a trailing slash but keep the root', () => {
    expect(canonical('https://og.trakt.tv/about/')).toBe('https://og.trakt.tv/about');
    expect(canonical('https://og.trakt.tv/')).toBe('https://og.trakt.tv/');
  });

  it('should use the path the page names instead', () => {
    expect(canonical('https://og.trakt.tv/home?utm_source=x', '/')).toBe('https://og.trakt.tv/');
  });
});
