/**
 * A key's count split for its bold number: "2 shows" into "2" and "shows", "3h 26m" all number, "12 of 30 days" into
 * "12" and "of 30 days", "23% of watchers" into "23%" and "of watchers". A count that doesn't start with one ("Sep 13 to 19", "Totally Ninja!") is all words.
 */
export function splitCount(count: string): { value?: string; text?: string } {
  const match = /^(\d[\d,.]*(?:%|[dhm](?: \d+[dhm])*)?)(?: (.+))?$/.exec(count);
  if (!match) return { text: count };
  return { value: match[1], text: match[2] };
}
