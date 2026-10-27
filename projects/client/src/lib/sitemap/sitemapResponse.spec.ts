import { describe, expect, it } from 'vitest';
import { sitemapResponse } from './sitemapResponse.ts';

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';

describe('util: sitemapResponse', () => {
  it('should serve the XML for a day on og.trakt.tv, indexable', async () => {
    const response = sitemapResponse({ xml, host: 'og.trakt.tv' });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(xml);
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400, s-maxage=86400');
    expect(response.headers.has('x-robots-tag')).toBe(false);
  });

  it('should ask search engines not to index it on any other host', () => {
    expect(sitemapResponse({ xml, host: 'localhost:5173' }).headers.get('x-robots-tag')).toBe('noindex');
    expect(sitemapResponse({ xml: null, host: 'preview.example.dev' }).headers.get('x-robots-tag')).toBe('noindex');
  });

  it('should answer 503, never cached, when the API failed', () => {
    const response = sitemapResponse({ xml: null, host: 'og.trakt.tv' });

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('retry-after')).toBe('3600');
  });
});
