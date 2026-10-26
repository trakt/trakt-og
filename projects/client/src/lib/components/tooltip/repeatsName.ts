const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * Whether a tooltip only says its trigger's name again ("Edit note" on an "Edit note" button), ignoring case,
 * spacing and punctuation. Linked as the description too, a screen reader would read it twice.
 */
export function repeatsName(name: string, description: string): boolean {
  const said = words(description);
  return said !== '' && words(name) === said;
}
