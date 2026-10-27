import type { SeoMeta } from '../SeoMeta.ts';

type Params = {
  comment: { readonly comment: string; readonly spoiler: boolean };
  author: string;
  /** What the comment is about: "Inception (2010)". */
  title: string;
  poster?: string;
};

const INLINE_SPOILER = /\[spoiler\][\s\S]*?\[\/spoiler\]/gi;

/**
 * `/comments/:id`: "Comment by Justin on Inception (2010)", the comment's text and the title's poster. A spoiler, whole
 * or inline, never reaches the description.
 */
export function toCommentSeo({ comment, author, title, poster }: Params): SeoMeta {
  const text = comment.spoiler ? '' : comment.comment.replace(INLINE_SPOILER, '[spoiler]').trim();
  const fallback = comment.spoiler ? `A comment with spoilers about ${title}.` : `A comment about ${title}.`;
  return {
    title: `Comment by ${author} on ${title}`,
    description: text || fallback,
    image: poster,
    imageAlt: title,
  };
}
