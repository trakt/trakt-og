import { describe, expect, it } from 'vitest';
import { isAllowedByRobots } from './isAllowedByRobots.ts';
import { parseRobotsTxt } from './parseRobotsTxt.ts';

const robots = parseRobotsTxt(`
User-agent: *
Content-Signal: search=yes, ai-train=no
Allow: /

User-agent: GPTBot
User-agent: ClaudeBot
Disallow: /

# og's own rules
User-agent: *
Disallow: /api/
Disallow: /dashboard
Disallow: /*?*genres=
Allow: /api/logo/public$

Sitemap: https://og.trakt.tv/sitemap.xml
`);

describe('isAllowedByRobots', () => {
  it('should merge every * group for an agent without its own group', () => {
    expect(isAllowedByRobots(robots, 'Googlebot', '/movies/inception-2010')).toBe(true);
    expect(isAllowedByRobots(robots, 'Googlebot', '/api/klipy/search')).toBe(false);
    expect(isAllowedByRobots(robots, 'Googlebot', '/dashboard/anything')).toBe(false);
  });

  it('should use only the named group for an agent that has one', () => {
    expect(isAllowedByRobots(robots, 'gptbot', '/movies/inception-2010')).toBe(false);
    expect(isAllowedByRobots(robots, 'ClaudeBot', '/')).toBe(false);
  });

  it('should match wildcards against the query', () => {
    expect(isAllowedByRobots(robots, 'Googlebot', '/movies/trending?genres=action')).toBe(false);
    expect(isAllowedByRobots(robots, 'Googlebot', '/movies/trending?page=2')).toBe(true);
  });

  it('should let the longest rule win, and honor an end anchor', () => {
    expect(isAllowedByRobots(robots, 'Googlebot', '/api/logo/public')).toBe(true);
    expect(isAllowedByRobots(robots, 'Googlebot', '/api/logo/public/more')).toBe(false);
  });

  it('should allow everything when nothing matches', () => {
    expect(isAllowedByRobots(parseRobotsTxt(''), 'Googlebot', '/dashboard')).toBe(true);
  });
});

describe('parseRobotsTxt', () => {
  it('should group consecutive user-agents and read global sitemaps', () => {
    expect(robots.groups.map((group) => group.agents)).toEqual([['*'], ['gptbot', 'claudebot'], ['*']]);
    expect(robots.sitemaps).toEqual(['https://og.trakt.tv/sitemap.xml']);
  });
});
