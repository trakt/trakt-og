import { match as isChart } from '../../params/chart.ts';

type SummaryType = 'movie' | 'show' | 'season' | 'episode' | 'person';
type DrilldownTarget = { event: 'summary'; type: SummaryType } | { event: 'list' };

const SITE = 'https://og.trakt.tv';

const SUMMARY: ReadonlyArray<{ type: SummaryType; path: RegExp }> = [
  { type: 'episode', path: /^\/shows\/[^/]+\/seasons\/[^/]+\/episodes\/[^/]+$/ },
  { type: 'season', path: /^\/shows\/[^/]+\/seasons\/(?!all$)[^/]+$/ },
  { type: 'movie', path: /^\/movies\/[^/]+$/ },
  { type: 'show', path: /^\/shows\/[^/]+$/ },
  { type: 'person', path: /^\/people\/[^/]+$/ },
];

const LIST = [
  /^\/users\/[^/]+\/(smart-)?lists\/(?!collaborations$|liked$)[^/]+$/,
  /^\/lists\/official\/[^/]+$/,
  /^\/lists\/\d+$/,
];

// `/movies/trending` and `/movies/boxoffice` are shaped like a movie's page.
const isChartPage = (path: string) => {
  const [, , last] = path.split('/');
  return last === 'boxoffice' || isChart(last ?? '');
};

/**
 * What a link opens, as trakt-web's drilldown events name it: an item's summary page (`action.summary-drilldown`) or a
 * list (`action.drilldown` with type `list`). Null for anything else, including an item's own subpages.
 */
export function toDrilldownTarget(href: string): DrilldownTarget | null {
  const url = new URL(href, SITE);
  if (url.origin !== SITE) return null;

  const path = url.pathname.replace(/(.)\/$/, '$1');
  const summary = SUMMARY.find(({ path: pattern }) => pattern.test(path));
  if (summary) return isChartPage(path) ? null : { event: 'summary', type: summary.type };

  return LIST.some((pattern) => pattern.test(path)) ? { event: 'list' } : null;
}
