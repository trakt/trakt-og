const INDEX = 'index, follow, max-image-preview:large';
// `follow`, so links on a page kept out of search still count.
const NOINDEX = 'noindex, follow';

/** Public pages search engines list, by route id. Everything else, and every error, stays out. */
const INDEXED_ROUTES: ReadonlySet<string> = new Set([
  '/',
  '/home',
  '/about',
  '/discover',
  '/movies/[chart=chart]/[[period]]',
  '/shows/[chart=chart]/[[period]]',
  '/movies/boxoffice',
  '/calendars/[calendar=calendar]/[[start]]',
  '/lists/official/[slug]',
  '/users/[id]',
  '/users/[id]/lists/[list]',
  '/comments/[id]',
]);

/** Every page about a title or a person, subpages included. */
const INDEXED_PREFIXES: readonly string[] = ['/movies/[id]', '/shows/[id]', '/people/[id]'];

const isIndexedRoute = (routeId: string) =>
  INDEXED_ROUTES.has(routeId) ||
  INDEXED_PREFIXES.some((prefix) => routeId === prefix || routeId.startsWith(`${prefix}/`));

type Params = {
  /** SvelteKit's `page.route.id`; null when no route matched. */
  routeId: string | null;
  status: number;
  /** The page's own content isn't public: a private profile or list, or a comment that isn't a review. */
  noindex?: boolean;
};

/** The page's robots meta: indexed for the public pages above, `noindex, follow` for the rest. */
export function toRobots({ routeId, status, noindex = false }: Params): string {
  if (status >= 400 || noindex || !routeId) return NOINDEX;
  return isIndexedRoute(routeId) ? INDEX : NOINDEX;
}
