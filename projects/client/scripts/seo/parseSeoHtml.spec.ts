import { describe, expect, it } from 'vitest';
import { parseSeoHtml } from './parseSeoHtml.ts';

const page = (head: string, body = '') => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

describe('parseSeoHtml', () => {
  it('should read titles from the head only, not SVG titles in the body', () => {
    const html = page('<title>Inception (2010) - Trakt OG Redux</title>', '<svg><title>Star</title></svg>');

    expect(parseSeoHtml(html).titles).toEqual(['Inception (2010) - Trakt OG Redux']);
  });

  it('should decode entities and drop hydration comments', () => {
    const html = page('<title><!--[-->Tom &amp; Jerry&#39;s &quot;Show&quot;<!--]--></title>');

    expect(parseSeoHtml(html).titles).toEqual(['Tom & Jerry\'s "Show"']);
  });

  it('should group meta tags by name or property, keeping duplicates', () => {
    const html = page(
      '<meta property="og:site_name" content="Trakt" />' +
        "<meta content='Trakt OG Redux' property='og:site_name'>" +
        '<meta name="Description" content="A thief who steals secrets." />' +
        '<meta charset="utf-8" />',
    );

    const { meta } = parseSeoHtml(html);
    expect(meta.get('og:site_name')).toEqual(['Trakt', 'Trakt OG Redux']);
    expect(meta.get('description')).toEqual(['A thief who steals secrets.']);
    expect(meta.size).toBe(2);
  });

  it('should read canonical links among other links', () => {
    const html = page(
      '<link rel="icon" href="/favicon.ico" /><link href="https://og.trakt.tv/movies/inception-2010" rel="canonical" />',
    );

    expect(parseSeoHtml(html).canonicals).toEqual(['https://og.trakt.tv/movies/inception-2010']);
  });

  it('should collect JSON-LD scripts anywhere in the page and skip other scripts', () => {
    const html = page(
      '<script type="application/ld+json">{"@type":"Movie"}</script><script>window.x = 1</script>',
      '<script type=application/ld+json>{"@type":"BreadcrumbList"}</script>',
    );

    expect(parseSeoHtml(html).jsonLd).toEqual(['{"@type":"Movie"}', '{"@type":"BreadcrumbList"}']);
  });

  it('should read the text of main without its scripts and styles', () => {
    const html = page(
      '',
      '<main id="content"><h1>Inception <span>2010</span></h1><style>h1{}</style><script>x()</script></main>',
    );

    expect(parseSeoHtml(html).main).toBe('Inception 2010');
  });

  it('should report no main when only the splash rendered', () => {
    expect(parseSeoHtml(page('', '<section class="splash">Made for bigger screens</section>')).main).toBeNull();
  });
});
