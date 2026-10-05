type Fact = { readonly text: string; readonly bold: string };

export type AboutMeView =
  | {
    readonly kind: 'filled';
    readonly about: string;
    /** "VIP · 17 yrs", or "VIP" in the first year. */
    readonly vip: string | null;
    /** "September 2010". */
    readonly joined: string | null;
    readonly location: string;
  }
  /** Your own, empty: a prompt to write one, in the settings on v3 web. */
  | { readonly kind: 'self'; readonly settingsHref: string }
  /** Someone else's, empty: a few facts instead. */
  | { readonly kind: 'other'; readonly name: string; readonly facts: readonly Fact[] };
