import { loadBoxOfficePreview } from '../boxoffice/loadBoxOfficePreview.ts';
import { calendarWindow } from '../calendars/calendarWindow.ts';
import { MY_CALENDARS } from '../calendars/myCalendars.ts';
import { PUBLIC_CALENDARS } from '../calendars/publicCalendars.ts';
import { toCalendarSeo } from '../calendars/toCalendarSeo.ts';
import { chartAliases, chartNames, isChartAlias, isPeriodChart } from '../charts/chartNames.ts';
import { chartPeriod } from '../charts/chartPeriod.ts';
import { toChartSeo } from '../charts/toChartSeo.ts';
import { loadListCommentsPreview } from '../lists/comments/loadListCommentsPreview.ts';
import { loadOfficialListPreview } from '../lists/loadOfficialListPreview.ts';
import { findSearchType } from '../search/findSearchType.ts';
import { retiredSearchTypes } from '../search/retiredSearchTypes.ts';
import { searchListType } from '../search/searchListType.ts';
import { toSearchSeo } from '../search/toSearchSeo.ts';
import { staticSeo } from '../seo/pages/staticSeo.ts';
import type { SeoMeta } from '../seo/SeoMeta.ts';
import { loadUserPreview } from '../users/loadUserPreview.ts';
import { dayIn } from '../utils/dayIn.ts';
import { error } from '@sveltejs/kit';
import type { PreviewRoute } from './PreviewRoute.ts';
import type { PreviewSource } from './PreviewSource.ts';

const ofSeo = (seo: SeoMeta, href: string): PreviewSource => ({ seo, title: seo.title ?? '', href });

const STATIC_SOURCES: readonly PreviewRoute[] = Object.entries(staticSeo).map(([route, seo]) => ({
  route,
  subpages: false,
  load: () => Promise.resolve(ofSeo(seo, route)),
}));

function chartSource(type: 'movies' | 'shows'): PreviewRoute {
  return {
    route: `/${type}/[chart=chart]/[[period]]`,
    subpages: false,
    load: ({ params }) => {
      const requested = params.chart ?? '';
      const named = isChartAlias(requested) ? chartAliases[requested] : requested;
      const chart = chartNames.find((name) => name === named);
      if (!chart) error(404, 'Not Found');
      // Recommendations are the viewer's own: a signed-out visitor signs in.
      if (chart === 'recommendations') return Promise.resolve(ofSeo(staticSeo['/signin'], '/signin'));
      // Only the period charts take a second segment, as in the loader.
      if (params.period !== undefined && !isPeriodChart(chart)) error(404, 'Not Found');

      const seo = toChartSeo({ type, chart, period: chartPeriod(params.period) });
      return Promise.resolve(ofSeo(seo, `/${type}/${chart}`));
    },
  };
}

function calendarSource(target: 'all' | 'my'): PreviewRoute {
  const calendars = target === 'my' ? MY_CALENDARS : PUBLIC_CALENDARS;
  return {
    route:
      target === 'my' ? '/calendars/my/[calendar=myCalendar]/[[start]]' : '/calendars/[calendar=calendar]/[[start]]',
    subpages: false,
    load: ({ params, now }) => {
      const calendar = calendars.find(({ slug }) => slug === params.calendar);
      if (!calendar) error(404, 'Not Found');
      // A signed-out visitor to My calendars signs in.
      if (target === 'my') return Promise.resolve(ofSeo(staticSeo['/signin'], '/signin'));

      const { start } = calendarWindow({ start: params.start, today: dayIn(now, 'UTC'), period: 'month' });
      return Promise.resolve(ofSeo(toCalendarSeo({ target, calendar, start }), `/calendars/${calendar.slug}`));
    },
  };
}

function searchSource(route: string): PreviewRoute {
  return {
    route,
    subpages: false,
    load: ({ params, url }) => {
      const query = (params.id ?? url.searchParams.get('query') ?? url.searchParams.get('q') ?? '').trim();
      // A retired tab goes to Shows & Movies.
      const slug = params.type && retiredSearchTypes.includes(params.type) ? undefined : params.type;
      const type = findSearchType(slug);
      if (!type) error(404, 'Not Found');

      const listType = type.slug === 'lists' && !query ? searchListType(url.searchParams.get('type')) : undefined;
      return Promise.resolve(ofSeo(toSearchSeo({ slug: type.slug, query, listType }), '/search'));
    },
  };
}

/** The pages that aren't a title's, a person's or a comment's: static ones, charts, calendars, search, lists and members. */
export const PAGE_SOURCES: readonly PreviewRoute[] = [
  ...STATIC_SOURCES,
  chartSource('movies'),
  chartSource('shows'),
  {
    route: '/movies/boxoffice',
    subpages: false,
    load: ({ fetch }) => loadBoxOfficePreview({ fetch }),
  },
  calendarSource('all'),
  calendarSource('my'),
  searchSource('/search/[[type=searchType]]'),
  searchSource('/search/[type=searchType]/[id]'),
  {
    route: '/lists/official/[slug]',
    subpages: false,
    load: ({ fetch, params, url, routeId }) =>
      routeId.endsWith('/comments')
        ? loadListCommentsPreview({ fetch, target: { kind: 'official', slug: params.slug ?? '' } })
        : loadOfficialListPreview({ fetch, url, slug: params.slug ?? '' }),
  },
  { route: '/users/[id]', subpages: false, load: loadUserPreview },
];
