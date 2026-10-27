import { describe, expect, it } from 'vitest';
import type { Check } from './Check.ts';
import { checkPage } from './checkPage.ts';
import type { SeoSample } from './SeoSample.ts';

const movie: SeoSample = {
  row: 'movie',
  path: '/movies/inception-2010',
  robots: 'index',
  title: 'Inception (2010)',
  canonical: '/movies/inception-2010',
  ogType: ['video.movie'],
  image: 'art',
  jsonLd: ['Movie'],
  content: 'Inception',
};

const ART = 'https://media.trakt.tv/images/movies/000/016/662/fanarts/full/f8af1d949b.jpg';

const head = (overrides: Readonly<Record<string, string>> = {}) => {
  const tags: Readonly<Record<string, string>> = {
    title: '<title>Inception (2010) - Trakt OG Redux</title>',
    description: '<meta name="description" content="A thief who steals corporate secrets." />',
    robots: '<meta name="robots" content="index, follow, max-image-preview:large" />',
    canonical: '<link rel="canonical" href="https://og.trakt.tv/movies/inception-2010" />',
    ogTitle: '<meta property="og:title" content="Inception (2010)" />',
    ogDescription: '<meta property="og:description" content="A thief who steals corporate secrets." />',
    ogUrl: '<meta property="og:url" content="https://og.trakt.tv/movies/inception-2010" />',
    ogType: '<meta property="og:type" content="video.movie" />',
    ogSiteName: '<meta property="og:site_name" content="Trakt OG Redux" />',
    ogLocale: '<meta property="og:locale" content="en_US" />',
    ogImage: `<meta property="og:image" content="${ART}" />`,
    ogImageAlt: '<meta property="og:image:alt" content="Inception" />',
    twitterCard: '<meta name="twitter:card" content="summary_large_image" />',
    twitterSite: '<meta name="twitter:site" content="@trakt" />',
    jsonLd:
      '<script type="application/ld+json">[{"@type":"Organization"},{"@type":"Movie","name":"Inception"}]</script>',
    ...overrides,
  };
  return Object.values(tags).join('');
};

const html = (overrides?: Readonly<Record<string, string>>, body = '<main id="content"><h1>Inception</h1></main>') =>
  `<!doctype html><html><head>${head(overrides)}</head><body>${body}</body></html>`;

const response = (body: string, status = 200, headers: HeadersInit = {}) => ({
  status,
  headers: new Headers(headers),
  body,
});

const failures = (checks: readonly Check[]) => checks.filter((check) => !check.pass).map((check) => check.label);

describe('checkPage', () => {
  it('should pass a page that has everything', () => {
    const checks = checkPage({ sample: movie, response: response(html()), hostKind: 'production' });

    expect(failures(checks)).toEqual([]);
  });

  it('should stop at the status when the page does not answer 200', () => {
    const checks = checkPage({
      sample: movie,
      response: response('', 301, { location: '/movies/inception' }),
      hostKind: 'production',
    });

    expect(checks.map((check) => [check.label, check.pass, check.detail])).toEqual([
      ['answers 200', false, 'got 301 to /movies/inception'],
      ['no X-Robots-Tag noindex', true, 'got ""'],
    ]);
  });

  it('should fail a phone render that only has the splash', () => {
    const body = '<section class="splash">OG Redux is made for bigger screens.</section>';
    const checks = checkPage({ sample: movie, response: response(html({}, body)), hostKind: 'production' });

    expect(failures(checks)).toEqual(['has <main>']);
  });

  it('should fail a title without the site name and a second title', () => {
    const title = '<title>Inception (2010) - Trakt</title>';
    const wrong = checkPage({ sample: movie, response: response(html({ title })), hostKind: 'production' });
    const twice = checkPage({
      sample: movie,
      response: response(html({ title: `${title}${title}` })),
      hostKind: 'production',
    });

    expect(wrong.find((check) => check.label === 'title text')?.detail).toBe(
      'got "Inception (2010) - Trakt", want "Inception (2010) - Trakt OG Redux"',
    );
    expect(failures(twice)).toEqual(['one <title>']);
  });

  it('should fail a canonical on the preview host and a long description', () => {
    const checks = checkPage({
      sample: movie,
      response: response(
        html({
          canonical: '<link rel="canonical" href="https://og-preview.workers.dev/movies/inception-2010" />',
          description: `<meta name="description" content="${'word '.repeat(40)}" />`,
        }),
      ),
      hostKind: 'production',
    });

    expect(failures(checks)).toEqual(['description', 'canonical URL']);
  });

  it('should accept robots directives in any order', () => {
    const robots = '<meta name="robots" content="max-image-preview:large,follow,index" />';
    const checks = checkPage({ sample: movie, response: response(html({ robots })), hostKind: 'production' });

    expect(failures(checks)).toEqual([]);
  });

  describe('for share images', () => {
    it('should fail a .webp image, which Facebook and LinkedIn refuse', () => {
      const ogImage = `<meta property="og:image" content="${ART}.webp" />`;
      const checks = checkPage({ sample: movie, response: response(html({ ogImage })), hostKind: 'production' });

      expect(failures(checks)).toEqual(['og:image']);
    });

    it('should want a size only on the default image', () => {
      const sized =
        '<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />';
      const art = checkPage({
        sample: movie,
        response: response(html({ sized })),
        hostKind: 'production',
      });
      const fallback = checkPage({
        sample: { ...movie, image: 'default' },
        response: response(
          html({ ogImage: '<meta property="og:image" content="https://og.trakt.tv/og-share.jpg" />' }),
        ),
        hostKind: 'production',
      });

      expect(failures(art)).toEqual(['og:image size']);
      expect(failures(fallback)).toEqual(['og:image size']);
    });
  });

  describe('for JSON-LD', () => {
    it('should fail a missing type, broken JSON and null fields', () => {
      const jsonLd =
        '<script type="application/ld+json">{"@type":"Organization","logo":null}</script>' +
        '<script type="application/ld+json">{"@type":"Movie",}</script>';
      const checks = checkPage({ sample: movie, response: response(html({ jsonLd })), hostKind: 'production' });

      expect(failures(checks)).toEqual(['JSON-LD parses', 'no null fields', 'has Movie']);
    });
  });

  describe('for noindex pages', () => {
    const search: SeoSample = { row: 'search', path: '/search?query=inception', robots: 'noindex' };

    it('should check only the status, title count, robots tag, content and header', () => {
      const robots = '<meta name="robots" content="noindex, follow" />';
      const checks = checkPage({
        sample: search,
        response: response(`<html><head><title>Search</title>${robots}</head><body><main>Results</main></body></html>`),
        hostKind: 'production',
      });

      expect(checks.map((check) => [check.group, check.pass])).toEqual([
        ['status', true],
        ['title', true],
        ['robots', true],
        ['content', true],
        ['x-robots', true],
      ]);
    });

    it('should fail nofollow, which keeps links on personal pages from counting', () => {
      const robots = '<meta name="robots" content="noindex, nofollow" />';
      const checks = checkPage({
        sample: search,
        response: response(`<html><head><title>Search</title>${robots}</head><body><main>Results</main></body></html>`),
        hostKind: 'production',
      });

      expect(failures(checks)).toEqual(['robots value']);
    });
  });

  describe('for hosts', () => {
    it('should want X-Robots-Tag noindex on a preview host', () => {
      const bare = checkPage({ sample: movie, response: response(html()), hostKind: 'preview' });
      const tagged = checkPage({
        sample: movie,
        response: response(html(), 200, { 'x-robots-tag': 'noindex' }),
        hostKind: 'preview',
      });

      expect(failures(bare)).toEqual(['X-Robots-Tag noindex']);
      expect(failures(tagged)).toEqual([]);
    });

    it('should fail X-Robots-Tag noindex on og.trakt.tv', () => {
      const checks = checkPage({
        sample: movie,
        response: response(html(), 200, { 'x-robots-tag': 'noindex' }),
        hostKind: 'production',
      });

      expect(failures(checks)).toEqual(['no X-Robots-Tag noindex']);
    });
  });
});
