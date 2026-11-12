import type { SeoMeta } from '../seo/SeoMeta.ts';

/** What a link-preview bot's head needs about a page's title, person, list or member, from one or two API reads. */
export interface PreviewSource {
  /** The page's own head, as its page renders it. */
  readonly seo: SeoMeta;
  /** For its subpages' heads (`toSubpageSeo`), as their pages build them: the item's title, page, art and tag bar. */
  readonly title: string;
  readonly href: string;
  readonly image?: string;
  readonly parents?: readonly { readonly title: string; readonly href?: string }[];
  /** The item's type, for `subpageParents`: a season's or episode's tag bar steps up on the same subpage. */
  readonly type?: string;
  /** The title as the pages without the item's slim header (release dates, seasons, episodes) name it. */
  readonly fullTitle?: string;
}
