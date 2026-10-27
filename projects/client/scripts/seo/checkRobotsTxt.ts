import type { Check } from './Check.ts';
import { checkXRobotsTag } from './checkXRobotsTag.ts';
import type { HostKind } from './HostKind.ts';
import { isAllowedByRobots } from './isAllowedByRobots.ts';
import { maxAgeSeconds } from './maxAgeSeconds.ts';
import type { PageResponse } from './PageResponse.ts';
import { parseRobotsTxt } from './parseRobotsTxt.ts';
import { SEO_EXPECTATIONS } from './seoExpectations.ts';

const EXPECT = SEO_EXPECTATIONS.robotsTxt;
const group = 'robots.txt';

const productionChecks = (body: string): readonly Check[] => {
  const robots = parseRobotsTxt(body);
  const allowed = (path: string) => isAllowedByRobots(robots, 'og-seo-check', path);

  return [
    ...EXPECT.allowed.map((path) => ({ group, label: `allows ${path}`, pass: allowed(path), detail: 'blocked' })),
    ...EXPECT.disallowed.map((path) => ({ group, label: `blocks ${path}`, pass: !allowed(path), detail: 'allowed' })),
    {
      group,
      label: 'lists the sitemap',
      pass: robots.sitemaps.includes(EXPECT.sitemap),
      detail: `sitemaps: ${robots.sitemaps.join(', ') || 'none'}`,
    },
    {
      group,
      label: `Cloudflare's managed block (${EXPECT.managedBot})`,
      pass: !isAllowedByRobots(robots, EXPECT.managedBot, '/'),
      detail: `${EXPECT.managedBot} may crawl /`,
    },
  ];
};

const previewChecks = (body: string): readonly Check[] => [
  {
    group,
    label: 'Disallow: /',
    pass: !isAllowedByRobots(parseRobotsTxt(body), 'og-seo-check', '/'),
    detail: 'a preview host must block every crawler',
  },
];

/** og.trakt.tv opens the site to crawlers apart from private paths; every other host shuts it. */
export function checkRobotsTxt(response: PageResponse, hostKind: HostKind): readonly Check[] {
  const status: Check = {
    group,
    label: 'answers 200',
    pass: response.status === 200,
    detail: `got ${response.status}`,
  };
  if (!status.pass) return [status];

  const type = response.headers.get('content-type') ?? '';
  const age = maxAgeSeconds(response.headers.get('cache-control'));
  return [
    status,
    { group, label: 'text/plain', pass: type.startsWith('text/plain'), detail: `got "${type}"` },
    { group, label: 'cached for a day', pass: age >= EXPECT.cacheSeconds, detail: `max-age ${age}` },
    { ...checkXRobotsTag(response.headers, hostKind), group },
    ...(hostKind === 'production' ? productionChecks(response.body) : previewChecks(response.body)),
  ];
}
