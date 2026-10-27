/** The parts of a page search engines and link previews read. */
export interface SeoHtml {
  /** Every `<title>` in `<head>`. SVG titles in the body don't count. */
  titles: readonly string[];
  /** `<meta>` tags in `<head>`, keyed by their `name` or `property`, lowercased. */
  meta: ReadonlyMap<string, readonly string[]>;
  canonicals: readonly string[];
  /** The raw text of every JSON-LD script. */
  jsonLd: readonly string[];
  /** The text of `<main>`, tags stripped and whitespace collapsed; null when the page has none. */
  main: string | null;
}
