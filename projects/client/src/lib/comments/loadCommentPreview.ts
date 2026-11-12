import { error } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { authorOf } from '../components/comments/authorOf.ts';
import type { PreviewSource } from '../crawl/PreviewSource.ts';
import { toCommentSeo } from '../seo/pages/toCommentSeo.ts';
import { subpageItemSchema } from '../subpage/subpageItemSchema.ts';
import { toSubpageMedia } from '../subpage/toSubpageMedia.ts';

type Params = { fetch: typeof fetch; id: string };

function notFound(): never {
  error(404, 'Comment not found');
}

/**
 * A comment's head for a link-preview bot, from the comment and the item it is about, as `loadComment` reads them. A
 * reply goes by its parent's page, where the real page redirects to.
 */
export async function loadCommentPreview({ fetch, id }: Params): Promise<PreviewSource> {
  if (!/^\d+$/.test(id)) notFound();
  const client = api({ fetch });
  const [summary, itemResponse] = await Promise.all([
    client.comments.summary({ params: { id } }).catch(() => null),
    client.comments.item({ params: { id }, query: { extended: 'full' } }),
  ]);
  if (summary === null && itemResponse.status === 404) notFound();
  if (summary?.status === 404) notFound();
  if (summary?.status !== 200) error(502, 'The Trakt API could not load this comment.');
  const comment = summary.body;
  if (comment.user == null) notFound();
  if (comment.parent_id > 0) return loadCommentPreview({ fetch, id: String(comment.parent_id) });

  if (itemResponse.status === 404) notFound();
  if (itemResponse.status < 200 || itemResponse.status >= 300) {
    error(502, 'The Trakt API could not load what this comment is about.');
  }
  const body = subpageItemSchema.safeParse(itemResponse.body);
  if (!body.success) error(502, 'The Trakt API returned an invalid comment item.');
  const media = toSubpageMedia({ body: body.data });
  if (!media) notFound();

  const seo = toCommentSeo({
    comment,
    author: authorOf(comment.user).name,
    title: media.item.title,
    poster: media.previewPoster,
  });
  return {
    seo: { ...seo, noindex: !comment.review },
    title: media.item.title,
    href: media.href,
    type: media.item.type,
  };
}
