/**
 * About Me: the owner's words, or on your own empty profile a prompt to write them. `label` is
 * "About Me" on your own profile, "About Maya" on anyone else's.
 */
export type AboutMeView = { readonly label: string } & (
  | { readonly kind: 'filled'; readonly about: string }
  /** Your own, empty: a prompt to write one, in the settings on v3 web. */
  | { readonly kind: 'self'; readonly settingsHref: string }
);
