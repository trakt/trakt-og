/** OG's `parameterize`: "Visual Effects" becomes "visual-effects", for its anchor ids. */
export const parameterize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
