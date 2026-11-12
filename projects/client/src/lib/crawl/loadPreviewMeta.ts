import { loadMoviePreview } from '../movies/loadMoviePreview.ts';
import type { SeoMeta } from '../seo/SeoMeta.ts';
import { toSubpageSeo } from '../seo/pages/toSubpageSeo.ts';
import type { PreviewSource } from './PreviewSource.ts';

type LoadParams = { fetch: typeof fetch; params: Partial<Record<string, string>>; now: Date };

type Source = {
  /** The page's route id. Routes under it are its subpages, unless `subpages` is false. */
  readonly route: string;
  readonly subpages?: false;
  readonly load: (params: LoadParams) => Promise<PreviewSource>;
};

type Subpage = Parameters<typeof toSubpageSeo>[0]['subpage'];

/** Most specific first: an episode's route sits under its season's, and a season's under its show's. */
const SOURCES: readonly Source[] = [
  { route: '/movies/[id]', load: ({ fetch, params, now }) => loadMoviePreview({ fetch, id: params.id ?? '', now }) },
];

/** A subpage by the first segment under its title's route; `/shows/:id/seasons/all` is every episode. */
const SUBPAGES: Readonly<Record<string, Subpage>> = {
  comments: 'Comments',
  lists: 'Lists',
  people: 'People',
  releases: 'Release Dates',
  stats: 'Stats',
  videos: 'Videos',
  seasons: 'Seasons',
};

function toSubpage(rest: string): Subpage | undefined {
  if (rest === 'seasons/all') return 'Episodes';
  return SUBPAGES[rest.split('/').at(0) ?? ''];
}

const matches = (routeId: string, { route }: Source) => routeId === route || routeId.startsWith(`${route}/`);

type Params = LoadParams & { routeId: string | null };

/**
 * A page's head for a link-preview bot, from its title's summary alone, so a bot costs one or two API reads instead of
 * the page's dozen. A route without a source (charts, calendars, a member's history) gets the site's own head.
 */
export async function loadPreviewMeta({ routeId, ...params }: Params): Promise<SeoMeta> {
  const source = routeId ? SOURCES.find((candidate) => matches(routeId, candidate)) : undefined;
  if (!routeId || !source) return {};

  const found = await source.load(params);
  const subpage = source.subpages === false ? undefined : toSubpage(routeId.slice(source.route.length + 1));
  if (!subpage) return found.seo;

  return toSubpageSeo({ title: found.title, href: found.href, parents: found.parents, image: found.image, subpage });
}
