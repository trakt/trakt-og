import type { SeoMeta } from '../seo/SeoMeta.ts';

/** What a link-preview bot's head needs about a page's title, person, list or member, from one or two API reads. */
export interface PreviewSource {
  /** The page's own head, as its page renders it. */
  readonly seo: SeoMeta;
  /** For its subpages' heads (`toSubpageSeo`): the full title, the page and its art. */
  readonly title: string;
  readonly href: string;
  readonly image?: string;
  readonly parents?: readonly { readonly title: string; readonly href?: string }[];
}
