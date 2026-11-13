import { positiveInt } from '../utils/positiveInt.ts';
import type { PageMeta } from './PageMeta.ts';
import { rawApiFetch } from './rawApiFetch.ts';

export async function read(fetch: typeof globalThis.fetch, token: string | null, path: string) {
  const response = await rawApiFetch({ fetch, token, path });
  const body = response.status === 200 ? await response.json().catch(() => null) : null;
  return { response, body };
}

export const itemCount = (headers: Headers) => positiveInt(headers.get('x-pagination-item-count'), 0);

/** Every page of a list, up to `max`, read side by side after the first. */
export async function readAll<Row>(
  fetch: typeof globalThis.fetch,
  token: string | null,
  path: (page: number) => string,
  max: number,
  parse: (body: unknown) => Row[] | undefined,
) {
  const first = await read(fetch, token, path(1));
  const rows = parse(first.body);
  if (!rows) return { status: first.response.status, rows: undefined, total: 0 };
  const count = positiveInt(first.response.headers.get('x-pagination-page-count'), 1);
  const rest = await Promise.all(
    Array.from({ length: Math.min(count, max) - 1 }, (_, i) => read(fetch, token, path(i + 2))),
  );
  return {
    status: 200,
    rows: [...rows, ...rest.flatMap(({ body }) => parse(body) ?? [])],
    total: itemCount(first.response.headers),
  };
}

/** One page of rows sorted here. */
export function paged<Row>(rows: readonly Row[], current: number, limit: number) {
  const pages = Math.max(1, Math.ceil(rows.length / limit));
  return {
    slice: rows.slice((current - 1) * limit, current * limit),
    page: { type: 'paginated', current: Math.min(current, pages), total: pages } satisfies PageMeta,
  };
}
