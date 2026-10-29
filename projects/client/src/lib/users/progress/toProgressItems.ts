import type { OverlaySlices } from '../../overlay/OverlaySlices.ts';
import type { CachedShow } from '../../shows/cache/CachedShow.ts';
import type { CatalogEpisode, ShowCatalog } from '../../shows/cache/ShowCatalog.ts';
import type { ProgressItem } from './ProgressItem.ts';
import type { ProgressOptions } from './ProgressOptions.ts';
import type { ProgressType } from './progressTypes.ts';
import { toProgressItem } from './toProgressItem.ts';

type ToProgressItemsParams = {
  type: ProgressType;
  /** Every show from `/sync/progress/up_next_nitro`. */
  nitro: readonly ProgressItem[];
  /** Dropped shows' summaries from `/users/hidden/dropped`, for the ones the endpoint leaves out. */
  droppedShows?: ReadonlyMap<number, CachedShow>;
  /** `?list=`: every show on the list, with its summary. */
  listShows?: ReadonlyMap<number, CachedShow>;
  slices: Partial<OverlaySlices>;
  catalogs: ReadonlyMap<number, ShowCatalog>;
  options: ProgressOptions;
  now: number;
};

const same = (local: CatalogEpisode | undefined, endpoint: CatalogEpisode | undefined) =>
  local && local.id === endpoint?.id ? endpoint : local;

type Dates = ReadonlySet<number> | ReadonlyMap<number, string> | undefined;
const dateOf = (values: Dates, id: number) => (values instanceof Map ? values.get(id) || undefined : undefined);

/**
 * A tab's shows, unsorted and unfiltered.
 * Watched is the endpoint's shows minus the dropped and hidden ones; Rewatching keeps the ones you're rewatching;
 * Dropped keeps the dropped ones, counting any the endpoint left out from the overlay and their summary. Watched for a
 * list (`?list=`) is every show on it but the dropped ones, which stay on Dropped: unstarted or hidden ones too.
 *
 * The counts, plays and times come from the overlay's watches (`/sync/watched/shows`, already loaded app-wide), never
 * the endpoint's `completed`, which can count more episodes than were ever watched. Before a show's seasons open, the
 * endpoint's aired count is the total; once its catalog is in, every count is exact and matches the season lines.
 * Null until the overlay knows your watches too, so the numbers don't jump. Who you're rewatching comes from the
 * overlay once it's in, so a rewatch started or stopped here shows at once, and from the endpoint's own reset dates
 * until then, or for good when that read fails.
 */
export function toProgressItems({
  type,
  nitro,
  droppedShows,
  listShows,
  slices,
  catalogs,
  options,
  now,
}: ToProgressItemsParams): readonly ProgressItem[] | null {
  const { dropped, rewatching, progressHidden, hidden, watchedShows } = slices;
  if (!dropped || !progressHidden || !watchedShows) return null;

  const optimistic = hidden?.get('progress_watched');
  const isHidden = (id: number) => progressHidden.watched.shows.has(id) || Boolean(optimistic?.has(`show:${id}`));
  const wholeList = type === 'watched' ? listShows : undefined;
  const resetOf = (id: number, base?: ProgressItem) => (rewatching ? dateOf(rewatching, id) : base?.resetAt);
  const keep = ({ show: { id }, resetAt }: ProgressItem) => {
    if (wholeList) return wholeList.has(id) && !dropped.has(id);
    if (type === 'dropped') return dropped.has(id);
    if (dropped.has(id) || isHidden(id)) return false;
    return type === 'watched' || (rewatching ? rewatching.has(id) : Boolean(resetAt));
  };
  const listed = new Set(nitro.map(({ show }) => show.id));
  const missing = wholeList
    ? [...wholeList.values()].filter(({ id }) => !listed.has(id) && !dropped.has(id))
    : type === 'dropped'
      ? [...(droppedShows?.values() ?? [])].filter(({ id }) => dropped.has(id) && !listed.has(id))
      : [];

  const counted = (show: CachedShow, base?: ProgressItem): ProgressItem => {
    const resetAt = resetOf(show.id, base);
    const droppedAt = type === 'dropped' ? dateOf(dropped, show.id) : undefined;
    const item = toProgressItem({
      // The endpoint's aired count stands in until the catalog lists every episode.
      show: base ? { ...show, airedEpisodes: base.aired } : show,
      watched: watchedShows.get(show.id),
      collected: slices.collectedShows?.get(show.id),
      resetAt,
      droppedAt,
      hiddenSeasons: progressHidden.watched.seasons.get(show.id),
      catalog: catalogs.get(show.id),
      includeSpecials: options.includeSpecials,
      useLastActivity: options.useLastActivity,
      now,
    });
    // The endpoint's next and last episodes stay; its watched counts don't (see the doc above).
    if (!base) return item;
    // Once the catalog is in, the next and last episodes follow your watches at once, without waiting on the endpoint.
    // The endpoint's copy of the same episode carries its screenshot.
    const local = item.detail;
    return {
      ...item,
      show: base.show,
      next: local ? same(local.next, base.next) : base.next,
      last: local ? same(local.last, base.last) : base.last,
    };
  };

  return [...nitro.filter(keep).map((item) => counted(item.show, item)), ...missing.map((show) => counted(show))];
}
