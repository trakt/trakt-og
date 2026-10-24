import { api } from '../api/api.ts';
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
export async function fetchTrendingComments({
  fetch,
  kind,
  media,
  now,
}: FetchTrendingCommentsParams): Promise<TrendingComment[]> {
  const response = await api({ fetch })
    .comments.trending({
      params: { comment_type: kind, type: media },
      query: { limit: 30, extended: 'images' },
    })
    .catch(() => null);
  if (!response || response.status < 200 || response.status >= 300) return [];
  const parsed = trendingCommentRowsSchema.safeParse(response.body);
  return parsed.success ? toTrendingComments(parsed.data, now) : [];
}
