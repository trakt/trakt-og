import { describe, expect, it } from 'vitest';
import type { Check } from './Check.ts';
import { checkRobotsTxt } from './checkRobotsTxt.ts';

const PRODUCTION = `User-agent: *
Content-Signal: search=yes, ai-train=no
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: *
Disallow: /api/
Disallow: /_design
Disallow: /callback
Disallow: /auth/
Disallow: /logout
Disallow: /dashboard
Disallow: /*?*genres=

Sitemap: https://og.trakt.tv/sitemap.xml
`;

const response = (body: string, headers: HeadersInit = {}) => ({
  status: 200,
  headers: new Headers({
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=86400',
    ...headers,
  }),
  body,
});

const failures = (checks: readonly Check[]) => checks.filter((check) => !check.pass).map((check) => check.label);

describe('checkRobotsTxt', () => {
  describe('on og.trakt.tv', () => {
    it("should pass og's rules under Cloudflare's managed block", () => {
      expect(failures(checkRobotsTxt(response(PRODUCTION), 'production'))).toEqual([]);
    });

    it('should fail a block on a noindex page, which crawlers then never see', () => {
      const checks = checkRobotsTxt(response(`${PRODUCTION}\nUser-agent: *\nDisallow: /search\n`), 'production');

      expect(failures(checks)).toEqual(['allows /search?query=inception']);
    });

    it('should fail a missing sitemap line, managed block and day of caching', () => {
      const body = PRODUCTION.replace(/User-agent: GPTBot\nDisallow: \/\n/, '').replace(/Sitemap: .*/, '');
      const checks = checkRobotsTxt(response(body, { 'cache-control': 'max-age=60' }), 'production');

      expect(failures(checks)).toEqual([
        'cached for a day',
        'lists the sitemap',
        "Cloudflare's managed block (GPTBot)",
      ]);
    });
  });

  describe('on a preview host', () => {
    it('should want every crawler blocked and the noindex header', () => {
      const shut = checkRobotsTxt(response('User-agent: *\nDisallow: /\n', { 'x-robots-tag': 'noindex' }), 'preview');
      const open = checkRobotsTxt(response(PRODUCTION), 'preview');

      expect(failures(shut)).toEqual([]);
      expect(failures(open)).toEqual(['X-Robots-Tag noindex', 'Disallow: /']);
    });
  });

  it('should stop at a missing file', () => {
    const checks = checkRobotsTxt({ status: 404, headers: new Headers(), body: '' }, 'production');

    expect(checks.map((check) => [check.label, check.detail])).toEqual([['answers 200', 'got 404']]);
  });
});
