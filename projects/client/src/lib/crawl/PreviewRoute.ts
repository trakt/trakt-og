import type { PreviewSource } from './PreviewSource.ts';

/** What a preview route's `load` gets: the request, and whether the page is an item subpage with a tag bar. */
export type PreviewRouteParams = {
  fetch: typeof fetch;
  params: Partial<Record<string, string>>;
  /** The page's URL, for the pages whose head follows the query or a date. */
  url: URL;
  now: Date;
  routeId: string;
  /** The page has the item's tag bar (a subpage under its slim header), which may read more. */
  tagBar: boolean;
};

/** A page route a link-preview bot gets a head for, and how its head loads. */
export type PreviewRoute = {
  /** The page's route id. Routes under it are its subpages, unless `subpages` is false. */
  readonly route: string;
  readonly subpages?: false;
  readonly load: (params: PreviewRouteParams) => Promise<PreviewSource>;
};
