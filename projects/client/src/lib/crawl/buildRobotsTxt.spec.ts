import { describe, expect, it } from 'vitest';
import { buildRobotsTxt } from './buildRobotsTxt.ts';

describe('util: buildRobotsTxt', () => {
  describe('for og.trakt.tv', () => {
    const lines = buildRobotsTxt({ production: true }).split('\n');

    it('should allow everything but the private paths', () => {
      expect(lines.slice(0, 8)).toEqual([
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /_design',
        'Disallow: /callback',
        'Disallow: /auth/',
        'Disallow: /logout',
        'Disallow: /dashboard',
      ]);
    });

    it('should keep filter, sort and view permutations out of the crawl', () => {
      expect(lines).toEqual(
        expect.arrayContaining([
          'Disallow: /*?*genres=',
          'Disallow: /*?*rt_user_meters=',
          'Disallow: /*?*watchnow=',
          'Disallow: /*?*sort=',
          'Disallow: /*?*sort_how=',
          'Disallow: /*?*display=',
          'Disallow: /*?*hide=',
        ]),
      );
    });

    it('should leave pagination, search and the pages it redirects to crawlable', () => {
      const params = lines.filter((line) => line.startsWith('Disallow: /*?*'));
      expect(params.some((line) => /[?*](page|query|q|type)=$/.test(line))).toBe(false);
      expect(lines.some((line) => /^Disallow: \/(search|users|movies|shows|people|lists)/.test(line))).toBe(false);
    });

    it('should point to the sitemap on og.trakt.tv', () => {
      expect(lines.at(-2)).toBe('Sitemap: https://og.trakt.tv/sitemap.xml');
    });

    it('should leave AI crawler rules to Cloudflare', () => {
      expect(lines.filter((line) => line.startsWith('User-agent:'))).toEqual(['User-agent: *']);
    });
  });

  it('should disallow everything on any other host', () => {
    expect(buildRobotsTxt({ production: false })).toBe('User-agent: *\nDisallow: /\n');
  });
});
