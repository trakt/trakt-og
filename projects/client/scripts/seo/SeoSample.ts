/** What one sample page must show search engines and link previews. */
export interface SeoSample {
  /** The row name in the report. */
  row: string;
  path: string;
  /** A made-up path of the same type, which must answer 404. */
  missing?: string;
  robots: 'index' | 'noindex';
  /** The full `<title>`: a string is the page part before " - Trakt OG Redux", a RegExp tests the whole title. */
  title?: string | RegExp;
  /** The canonical path on og.trakt.tv. Indexable pages only. */
  canonical?: string;
  /** Allowed `og:type` values. */
  ogType?: readonly string[];
  /** `art` is media.trakt.tv art, `default` the default share image, `any` either. */
  image?: 'art' | 'default' | 'any';
  /** JSON-LD `@type`s this page must carry. */
  jsonLd?: readonly string[];
  /** Text the page's `<main>` must contain in the server HTML. */
  content?: string;
}
