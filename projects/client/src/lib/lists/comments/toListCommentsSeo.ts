import type { SeoMeta } from '../../seo/SeoMeta.ts';
import type { ListCommentsTarget } from './ListCommentsTarget.ts';

/** A list's comments page: "All comments for Best of 2024", over the list's own description. */
export const toListCommentsSeo = ({
  fullTitle,
  description,
}: Pick<ListCommentsTarget, 'fullTitle' | 'description'>): SeoMeta => ({
  title: `All comments for ${fullTitle}`,
  description: description ?? `Read comments about ${fullTitle}.`,
});
