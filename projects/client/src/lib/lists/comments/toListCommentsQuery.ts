import { listCommentSort } from './listCommentSort.ts';
import type { listCommentSorts } from './listCommentSorts.ts';
import { positiveInt } from '../../utils/positiveInt.ts';

export type ListCommentsQuery = {
  readonly sort: keyof typeof listCommentSorts;
  readonly page: number;
  /** OG's `params[:limit] || 100`, capped at 100. */
  readonly limit: number;
};

/** A list comments URL's sort, page and page size. */
export function toListCommentsQuery(query: URLSearchParams): ListCommentsQuery {
  return {
    sort: listCommentSort(query),
    page: positiveInt(query.get('page'), 1),
    limit: Math.min(100, positiveInt(query.get('limit') ?? '100', 1)),
  };
}
