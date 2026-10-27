/** What a page's JSON-LD scripts hold. */
export interface JsonLd {
  /** Top-level `@type`s, including members of an `@graph`. Nested values like `partOfSeries` don't count. */
  types: readonly string[];
  /** Parse errors, one per script that isn't valid JSON. */
  errors: readonly string[];
  /** Paths of fields sent as null instead of left out. */
  nulls: readonly string[];
}
