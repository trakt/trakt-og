import { rawApiFetch } from '../api/rawApiFetch.ts';
import { toTrendingComments, type TrendingComment } from './toTrendingComments.ts';
import { trendingCommentFilters } from './trendingCommentFilters.ts';
import { trendingCommentRowsSchema } from './trendingCommentRowsSchema.ts';

type FetchTrendingCommentsParams = {
  fetch: typeof fetch;
  kind: (typeof trendingCommentFilters.kinds)[number]['id'];
  media: (typeof trendingCommentFilters.media)[number]['id'];
  now: Date;
};

/** One kind of comment on one type of title, trending now; empty when the call or the parse fails. */
export async function fetchTrendingComments(
  { fetch, kind, media, now }: FetchTrendingCommentsParams,
): Promise<TrendingComment[]> {
  const path = `/comments/trending/${kind}/${media}?limit=30&extended=images`;
  const response = await rawApiFetch({ fetch, path }).catch(() => null);
  if (!response?.ok) return [];
  const parsed = trendingCommentRowsSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? toTrendingComments(parsed.data, now) : [];
}
