import { PUBLIC_CALENDARS } from '../calendars/publicCalendars.ts';
import { chartNames, isPeriodChart } from '../charts/chartNames.ts';
import type { ChartPeriod } from '../charts/chartPeriod.ts';
import type { SitemapUrl } from './SitemapUrl.ts';

const PERIODS: readonly ChartPeriod[] = ['daily', 'weekly', 'monthly', 'all'];

// Recommendations are the viewer's own and send a signed-out visitor to sign in.
const chartPaths = (type: 'movies' | 'shows') =>
  chartNames
    .filter((chart) => chart !== 'recommendations')
    .flatMap((chart) =>
      isPeriodChart(chart) ? PERIODS.map((period) => `/${type}/${chart}/${period}`) : [`/${type}/${chart}`],
    );

/**
 * og's indexable pages that aren't a movie, show or list: each one loads for a signed-out visitor at its own address,
 * not a redirect. They have no `lastmod`, since nothing says when they last changed.
 */
export const pageSitemapUrls: readonly SitemapUrl[] = [
  '/',
  '/about',
  '/discover',
  ...chartPaths('movies'),
  '/movies/boxoffice',
  ...chartPaths('shows'),
  ...PUBLIC_CALENDARS.map(({ slug }) => `/calendars/${slug}`),
].map((path) => ({ path }));
