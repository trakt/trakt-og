type WatchNowSettings =
  | {
    readonly browsing?: { readonly watchnow?: { readonly country?: string | null } | null } | null;
  }
  | null
  | undefined;

// ponytail: OG fell back to the visitor's IP country; og uses US until the viewer's setting says otherwise.
/** The viewer's watch-now country as the API's lowercase code. */
export const watchNowCountry = (settings: WatchNowSettings) =>
  settings?.browsing?.watchnow?.country?.toLowerCase() || 'us';
