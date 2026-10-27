import type { Check } from './Check.ts';
import { checkXRobotsTag } from './checkXRobotsTag.ts';
import type { HostKind } from './HostKind.ts';
import { maxAgeSeconds } from './maxAgeSeconds.ts';
import type { PageResponse } from './PageResponse.ts';
import { parseSitemap } from './parseSitemap.ts';
import { SEO_EXPECTATIONS } from './seoExpectations.ts';
import type { Sitemap } from './Sitemap.ts';

interface CheckSitemapParams {
  response: PageResponse;
  hostKind: HostKind;
  kind: Sitemap['kind'];
  /** Paths on og.trakt.tv the sitemap must list. */
  includes: readonly string[];
  /** Whether every entry needs its own `lastmod`. */
  lastmod: boolean;
  maxUrls: number;
}

const group = 'sitemap';
const ORIGIN = SEO_EXPECTATIONS.origin;
const W3C_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;

const lastmodChecks = (sitemap: Sitemap): readonly Check[] => {
  const dates = sitemap.entries.map((entry) => entry.lastmod ?? '');
  const missing = dates.filter((date) => !W3C_DATE.test(date)).length;
  const days = new Set(dates.map((date) => date.slice(0, 10)));

  return [
    { group, label: 'lastmod on every URL', pass: missing === 0, detail: `${missing} missing or not W3C dates` },
    {
      group,
      label: 'lastmod from updated_at',
      pass: dates.length < 2 || days.size > 1,
      detail: `every URL says ${[...days].join(', ')}`,
    },
  ];
};

/** A sitemap that parses, lists only og.trakt.tv URLs, stays in its size cap and is cached for a day. */
export function checkSitemap({
  response,
  hostKind,
  kind,
  includes,
  lastmod,
  maxUrls,
}: CheckSitemapParams): readonly Check[] {
  const status: Check = {
    group,
    label: 'answers 200',
    pass: response.status === 200,
    detail: `got ${response.status}`,
  };
  if (!status.pass) return [status];

  const sitemap = parseSitemap(response.body);
  const locs = sitemap.entries.map((entry) => entry.loc);
  const offsite = locs.find((loc) => !loc.startsWith(`${ORIGIN}/`));
  const duplicates = locs.length - new Set(locs).size;
  const type = response.headers.get('content-type') ?? '';
  const age = maxAgeSeconds(response.headers.get('cache-control'));

  return [
    status,
    { group, label: 'XML', pass: /\b(application|text)\/xml\b/.test(type), detail: `got "${type}"` },
    { group, label: 'cached for a day', pass: age >= SEO_EXPECTATIONS.sitemaps.cacheSeconds, detail: `max-age ${age}` },
    { ...checkXRobotsTag(response.headers, hostKind), group },
    { group, label: `a ${kind}`, pass: sitemap.kind === kind, detail: `got ${sitemap.kind}` },
    { group, label: 'has URLs', pass: locs.length > 0, detail: 'empty' },
    { group, label: `at most ${maxUrls} URLs`, pass: locs.length <= maxUrls, detail: `${locs.length} URLs` },
    { group, label: `URLs on ${ORIGIN}`, pass: offsite === undefined, detail: `"${offsite}"` },
    { group, label: 'no duplicate URLs', pass: duplicates === 0, detail: `${duplicates} duplicates` },
    ...includes.map((path) => ({
      group,
      label: `lists ${path}`,
      pass: locs.includes(`${ORIGIN}${path}`),
      detail: 'missing',
    })),
    ...(lastmod ? lastmodChecks(sitemap) : []),
  ];
}
