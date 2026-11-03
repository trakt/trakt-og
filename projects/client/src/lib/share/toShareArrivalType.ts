// trakt-web's `toShareArrivalType`, keyed by og's route ids.
const SHARE_ARRIVAL_TYPE_BY_ROUTE: Readonly<Record<string, string>> = {
  '/movies/[id]': 'movie',
  '/shows/[id]': 'show',
  '/shows/[id]/seasons/[season]': 'season',
  '/shows/[id]/seasons/[season]/episodes/[episode]': 'episode',
  '/people/[id]': 'person',
  '/users/[id]/lists/[list]': 'list',
  '/lists/official/[slug]': 'list',
};

/** The `share.arrival` type of the page a shared link opened, from its route id: 'other' off an item's page. */
export function toShareArrivalType(route: string | null): string {
  return (route && SHARE_ARRIVAL_TYPE_BY_ROUTE[route]) ?? 'other';
}
