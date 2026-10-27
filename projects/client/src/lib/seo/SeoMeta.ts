import type { SeoType } from './SeoType.ts';

/** What a page says about itself in search results and link previews. The shared head fills in the rest. */
export interface SeoMeta {
  /** The page's own title, without the site name. Left out, the title is the site name alone. */
  readonly title?: string;
  /** Raw text: the head collapses whitespace, strips links and markup and cuts it at 160 characters. */
  readonly description?: string | null;
  /** Art for link previews. Left out, previews use the default share image. */
  readonly image?: string | null;
  /** Describes `image`; the page title when left out. */
  readonly imageAlt?: string;
  readonly type?: SeoType;
  /** Another path that shows the same page, for the canonical URL: `/home` is `/`. */
  readonly canonicalPath?: string;
  /** The content isn't public even though its route is: a private profile or list, a comment that isn't a review. */
  readonly noindex?: boolean;
}
