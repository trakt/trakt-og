// OG's option-tag replacements (advanced_filters.js:34-47): "Netflix (on Amazon)" lists as Netflix, tagged Amazon.
const storeTags = [
  [' (free)', 'Free'],
  [' (on Amazon)', 'Amazon'],
  [' (on Apple TV)', 'Apple TV'],
  [' (on Roku)', 'Roku'],
] as const;

/** A service's name without its store suffix, and that store as a tag to badge. */
export function serviceLabel(name: string): { readonly label: string; readonly tag?: string } {
  const store = storeTags.find(([suffix]) => name.toLowerCase().includes(suffix.toLowerCase()));
  if (!store) return { label: name };
  const at = name.toLowerCase().indexOf(store[0].toLowerCase());
  return { label: (name.slice(0, at) + name.slice(at + store[0].length)).trim(), tag: store[1] };
}
