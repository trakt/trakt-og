import { extractPageMeta } from '../api/extractPageMeta.ts';

type PagedResponse = { status: number; headers: Headers; body: unknown };
type Ok<R extends PagedResponse> = Extract<R, { status: 200 }>;

type FetchAllPagesParams<R extends PagedResponse> = {
  fetchPage: (page: number) => Promise<R>;
  /** The most pages to read, however many the API has. */
  maxPages: number;
};

const isOk = <R extends PagedResponse>(response: R | null): response is Ok<R> => response?.status === 200;

/**
 * Every page's body, up to `maxPages`: the first page, then the rest together once it says how many there are. Any
 * page that fails makes it null, so a sitemap is whole or not served at all.
 */
export async function fetchAllPages<R extends PagedResponse>({
  fetchPage,
  maxPages,
}: FetchAllPagesParams<R>): Promise<Ok<R>['body'][] | null> {
  const read = (page: number) => fetchPage(page).catch(() => null);

  const first = await read(1);
  if (!isOk(first)) return null;

  const meta = extractPageMeta(first.headers);
  const pages = meta.type === 'paginated' ? Math.min(meta.total, maxPages) : 1;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) => read(index + 2)));
  if (!rest.every(isOk)) return null;

  return [first, ...rest].map(({ body }) => body);
}
