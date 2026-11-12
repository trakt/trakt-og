import { loadCommentPreview } from '../comments/loadCommentPreview.ts';
import { loadMoviePreview } from '../movies/loadMoviePreview.ts';
import { loadPersonPreview } from '../people/loadPersonPreview.ts';
import type { SeoMeta } from '../seo/SeoMeta.ts';
import { toSubpageSeo } from '../seo/pages/toSubpageSeo.ts';
import { loadEpisodePreview } from '../shows/loadEpisodePreview.ts';
import { loadSeasonPreview } from '../shows/loadSeasonPreview.ts';
import { loadShowPreview } from '../shows/loadShowPreview.ts';
import { subpageParents } from '../subpage/subpageParents.ts';
import { PAGE_SOURCES } from './pageSources.ts';
import type { PreviewRoute, PreviewRouteParams } from './PreviewRoute.ts';

type Subpage = Parameters<typeof toSubpageSeo>[0]['subpage'];

/** Most specific first: an episode's route sits under its season's, and a season's under its show's. */
const SOURCES: readonly PreviewRoute[] = [
  {
    route: '/shows/[id]/seasons/[season]/episodes/[episode]',
    load: ({ fetch, params, now }) =>
      loadEpisodePreview({
        fetch,
        id: params.id ?? '',
        season: params.season ?? '',
        episode: params.episode ?? '',
        now,
      }),
  },
  {
    route: '/shows/[id]/seasons/[season]',
    load: ({ fetch, params, now }) =>
      loadSeasonPreview({ fetch, id: params.id ?? '', season: params.season ?? '', now }),
  },
  { route: '/shows/[id]', load: ({ fetch, params, now }) => loadShowPreview({ fetch, id: params.id ?? '', now }) },
  {
    route: '/movies/[id]',
    load: ({ fetch, params, now, tagBar }) => loadMoviePreview({ fetch, id: params.id ?? '', now, tagBar }),
  },
  { route: '/people/[id]', load: ({ fetch, params, now }) => loadPersonPreview({ fetch, id: params.id ?? '', now }) },
  {
    route: '/comments/[id]',
    subpages: false,
    load: ({ fetch, params }) => loadCommentPreview({ fetch, id: params.id ?? '' }),
  },
  ...PAGE_SOURCES,
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

/** Named by the page's own title, with no tag bar: release dates, a show's seasons and its episodes. */
const OWN_TITLE: ReadonlySet<Subpage> = new Set(['Release Dates', 'Seasons', 'Episodes']);

function toSubpage(rest: string): Subpage | undefined {
  if (rest === 'seasons/all') return 'Episodes';
  return SUBPAGES[rest.split('/').at(0) ?? ''];
}

const matches = (routeId: string, { route }: PreviewRoute) => routeId === route || routeId.startsWith(`${route}/`);

type Params = Omit<PreviewRouteParams, 'tagBar' | 'routeId'> & { routeId: string | null };

/**
 * A page's head for a link-preview bot, from the fewest reads that build it: none for a page whose head needs no data,
 * one to three for a title, list or member, instead of the page's dozen. A route without a source gets the site's head.
 */
export async function loadPreviewMeta({ routeId, ...params }: Params): Promise<SeoMeta> {
  const source = routeId ? SOURCES.find((candidate) => matches(routeId, candidate)) : undefined;
  if (!routeId || !source) return {};

  const rest = routeId.slice(source.route.length + 1);
  const subpage = source.subpages === false ? undefined : toSubpage(rest);
  const tagBar = subpage !== undefined && !OWN_TITLE.has(subpage);
  const found = await source.load({ ...params, routeId, tagBar });
  if (!subpage) return found.seo;

  const { type, href, image } = found;
  if (OWN_TITLE.has(subpage)) return toSubpageSeo({ title: found.fullTitle ?? found.title, href, image, subpage });

  const parents = subpageParents({
    type: type ?? '',
    parents: found.parents ?? [],
    suffix: rest.split('/').at(0) ?? '',
  });
  return toSubpageSeo({ title: found.title, href, parents, image, subpage });
}
