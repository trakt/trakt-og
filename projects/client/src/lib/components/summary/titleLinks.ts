export type OverviewPart = string | { readonly text: string; readonly href: string };

// The exact forms the API writes into a biography: `[*Title*](url)`, or `[Title](url)` when the title holds `*` or `_`.
const TITLE_LINK = /\[(?:\*([^*\]]+)\*|([^\]]+))\]\(https:\/\/app\.trakt\.tv(\/(?:movies|shows)\/[a-z0-9-]+)\)/g;

const toLink = ([, italic, plain = '', href = '']: RegExpExecArray): OverviewPart => ({ text: italic ?? plain, href });

/** Splits an overview into text and the API's title links, pointed at this site's summary pages. */
export function toOverviewParts(text: string): readonly OverviewPart[] {
  const matches = [...text.matchAll(TITLE_LINK)];
  const ends = [0, ...matches.map((match) => match.index + match[0].length)];
  return [
    ...matches.flatMap((match, i) => [text.slice(ends[i], match.index), toLink(match)]),
    text.slice(ends.at(-1)),
  ].filter((part) => part !== '');
}
