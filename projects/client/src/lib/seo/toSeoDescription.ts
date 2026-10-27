const MAX_LENGTH = 160;

/**
 * A description fit for a meta tag: Markdown links keep their text, bare URLs, HTML tags and Markdown emphasis go,
 * whitespace collapses, and anything over 160 characters is cut at a word with an ellipsis.
 */
export function toSeoDescription(text: string | null | undefined): string {
  const plain = (text ?? '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\*\*|__|~~|`/g, '')
    .replace(/^\s*(#{1,6}|>)\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= MAX_LENGTH) return plain;

  const cut = plain.slice(0, MAX_LENGTH - 1);
  const space = cut.lastIndexOf(' ');
  const word = space > MAX_LENGTH / 2 ? cut.slice(0, space) : cut;
  return `${word.replace(/[\s.,;:!?-]+$/, '')}…`;
}
