/** A smart list's own page, under its owner like their other lists. */
export const smartListPath = (owner: string, slug: string) =>
  `/users/${encodeURIComponent(owner)}/smart-lists/${encodeURIComponent(slug)}`;
