/** What a movie or show's external links read, typed loosely so the summaries and the subpages share the builders. */
export type LinkedMedia = {
  readonly ids: {
    readonly imdb?: string | null;
    readonly tmdb?: number | null;
    readonly tvdb?: number | null;
  };
  readonly homepage?: string | null;
  readonly title: string;
  readonly year?: number | null;
  readonly social_ids?: {
    readonly twitter?: string | null;
    readonly facebook?: string | null;
    readonly instagram?: string | null;
    readonly wikipedia?: string | null;
  } | null;
};
