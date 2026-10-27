// SEO launch check: what search engines and link previews see. Fetches one sample page per type as each crawler in
// seo/seoExpectations.ts, plus a made-up item of each type, robots.txt, the sitemaps and a few of their URLs.
// Usage: bun run seo:check [base URL] [--preview-url <url>]
// base URL defaults to http://localhost:5173. og.trakt.tv gets production rules; any other host must stay out of search.
// --preview-url also checks that a preview deploy sends X-Robots-Tag: noindex and blocks every crawler.
// Prints a pass/fail table and exits non-zero on any failure that isn't a known, tracked issue.
import process from 'node:process';
import type { Check } from './seo/Check.ts';
import type { CheckResult } from './seo/CheckResult.ts';
import { checkCanonical } from './seo/checkCanonical.ts';
import { checkIndexable } from './seo/checkIndexable.ts';
import { checkMissing } from './seo/checkMissing.ts';
import { checkPage } from './seo/checkPage.ts';
import { checkRobotsTxt } from './seo/checkRobotsTxt.ts';
import { checkSitemap } from './seo/checkSitemap.ts';
import { checkXRobotsTag } from './seo/checkXRobotsTag.ts';
import { formatReport } from './seo/formatReport.ts';
import type { HostKind } from './seo/HostKind.ts';
import type { PageResponse } from './seo/PageResponse.ts';
import { parseSeoHtml } from './seo/parseSeoHtml.ts';
import { parseSitemap } from './seo/parseSitemap.ts';
import { SEO_EXPECTATIONS as EXPECT } from './seo/seoExpectations.ts';
import type { SeoSample } from './seo/SeoSample.ts';

type Agent = keyof typeof EXPECT.userAgents;

const CONCURRENCY = 2;
const TIMEOUT_MS = 60_000;
const RATE_LIMIT_RETRIES = 4;
const RATE_LIMIT_WAIT_MS = 30_000;
const CRAWLER: Agent = 'googlebot-phone';
const AGENTS = Object.keys(EXPECT.userAgents) as Agent[];

const args = process.argv.slice(2);
const previewFlag = args.indexOf('--preview-url');
const previewUrl = previewFlag >= 0 ? args.at(previewFlag + 1) : undefined;
const base = new URL(
  args.find((arg, index) => !arg.startsWith('--') && (previewFlag < 0 || index !== previewFlag + 1)) ??
    'http://localhost:5173',
);
const hostKind: HostKind = base.origin === EXPECT.origin ? 'production' : 'preview';

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// og renders the API's 429 as a 429 page. Wait it out and try again, so the report shows the page, not the limit.
const fetchPage = async (url: URL | string, agent: Agent = CRAWLER): Promise<PageResponse | Error> => {
  const attempt = async (retries: number): Promise<PageResponse> => {
    const response = await fetch(url, {
      headers: { 'user-agent': EXPECT.userAgents[agent] },
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await response.text();
    if (response.status !== 429 || retries === 0) return { status: response.status, headers: response.headers, body };

    await pause(Number(response.headers.get('retry-after')) * 1000 || RATE_LIMIT_WAIT_MS);
    return attempt(retries - 1);
  };

  try {
    return await attempt(RATE_LIMIT_RETRIES);
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
};

const failed = (group: string, error: Error): Check => ({ group, label: 'fetch', pass: false, detail: error.message });

const place =
  (row: string, agent?: Agent) =>
  (checks: readonly Check[]): readonly CheckResult[] =>
    checks.map((result) => ({ ...result, row, ...(agent ? { agent } : {}) }));

// Runs `tasks` a few at a time, so the dev server and the API it reads aren't flooded.
const pool = async <T>(tasks: readonly (() => Promise<T>)[]): Promise<readonly T[]> => {
  const results: T[] = [];
  const queue = [...tasks.entries()];
  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [index, task] = next;
      results[index] = await task();
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
};

const sampleTask = (sample: SeoSample, agent: Agent) => async () => {
  const response = await fetchPage(new URL(sample.path, base), agent);
  const checks = response instanceof Error ? [failed('status', response)] : checkPage({ sample, response, hostKind });
  return place(sample.row, agent)(checks);
};

const missingTask = (row: string, path: string) => async () => {
  const response = await fetchPage(new URL(path, base));
  return place(row, CRAWLER)(response instanceof Error ? [failed('404', response)] : checkMissing(response));
};

const pageTasks = EXPECT.samples.flatMap((sample) => [
  ...AGENTS.map((agent) => sampleTask(sample, agent)),
  ...(sample.missing ? [missingTask(sample.row, sample.missing)] : []),
]);

const checkRobots = async ({ origin, kind, row }: { origin: URL; kind: HostKind; row: string }) => {
  const response = await fetchPage(new URL('/robots.txt', origin));
  return place(row)(response instanceof Error ? [failed('robots.txt', response)] : checkRobotsTxt(response, kind));
};

const toBase = (loc: string) => {
  const url = new URL(loc);
  return new URL(`${url.pathname}${url.search}`, base);
};

const probeUrls = async (path: string, locs: readonly string[]) => {
  const sample = path === '/sitemap/pages.xml' ? locs : locs.slice(0, EXPECT.sitemaps.probeUrls);
  const results = await pool(
    sample.map((loc) => async () => {
      const response = await fetchPage(toBase(loc));
      return place(`${path} URLs`)([
        response instanceof Error ? failed('urls', response) : checkIndexable(loc, response),
      ]);
    }),
  );
  return results.flat();
};

const checkSitemaps = async () => {
  const indexResponse = await fetchPage(new URL(EXPECT.sitemaps.index, base));
  const children = EXPECT.sitemaps.children;
  if (indexResponse instanceof Error) return place(EXPECT.sitemaps.index)([failed('sitemap', indexResponse)]);

  const index = place(EXPECT.sitemaps.index)(
    checkSitemap({
      response: indexResponse,
      hostKind,
      kind: 'index',
      includes: children.map((child) => child.path),
      lastmod: false,
      maxUrls: 50_000,
    }),
  );
  const listed = indexResponse.status === 200 ? parseSitemap(indexResponse.body).entries : [];
  const extra = listed
    .map((entry) => new URL(entry.loc, EXPECT.origin).pathname)
    .filter((path) => !children.some((child) => child.path === path))
    .map((path) => ({ path, lastmod: true, maxUrls: 50_000, includes: [] }));

  const files = await pool(
    [...children, ...extra].map((child) => async () => {
      const response = await fetchPage(new URL(child.path, base));
      if (response instanceof Error) return place(child.path)([failed('sitemap', response)]);

      const checks = place(child.path)(checkSitemap({ response, hostKind, kind: 'urlset', ...child }));
      const locs = response.status === 200 ? parseSitemap(response.body).entries.map((entry) => entry.loc) : [];
      return [...checks, ...(await probeUrls(child.path, locs))];
    }),
  );
  return [...index, ...files.flat()];
};

const checkCanonicalVariants = async () => {
  const results = await pool(
    EXPECT.canonicalVariants.map((variant) => async () => {
      const response = await fetchPage(new URL(variant.path, base));
      const checks =
        response instanceof Error
          ? failed('canon', response)
          : { ...checkCanonical(parseSeoHtml(response.body), variant.canonical), label: `${variant.path} canonical` };
      return place('canonical variants')([checks]);
    }),
  );
  return results.flat();
};

const checkPreviewHost = async (url: string) => {
  const preview = new URL(url);
  const headerChecks = await pool(
    EXPECT.previewPaths.map((path) => async () => {
      const response = await fetchPage(new URL(path, preview));
      const result =
        response instanceof Error ? failed('x-robots', response) : checkXRobotsTag(response.headers, 'preview');
      return place('preview host')([{ ...result, label: `${path} ${result.label}` }]);
    }),
  );
  return [...(await checkRobots({ origin: preview, kind: 'preview', row: 'preview host' })), ...headerChecks.flat()];
};

console.log(`SEO check: ${base.origin} (${hostKind} rules), each page as ${AGENTS.join(', ')}\n`);

const pages = (await pool(pageTasks)).flat();
const site = [
  ...(await checkRobots({ origin: base, kind: hostKind, row: 'robots.txt' })),
  ...(await checkSitemaps()),
  ...(await checkCanonicalVariants()),
  ...(previewUrl ? await checkPreviewHost(previewUrl) : []),
];

console.log(formatReport({ pages, site, agents: AGENTS }));
process.exitCode = [...pages, ...site].every((result) => result.pass || result.known) ? 0 : 1;
