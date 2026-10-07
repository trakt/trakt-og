import type { OverlaySlices } from '../../overlay/OverlaySlices.ts';
import type { CachedShow } from '../../shows/cache/CachedShow.ts';
import type { ShowCatalog } from '../../shows/cache/ShowCatalog.ts';
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
  slices: Partial<OverlaySlices>;
  catalogs: ReadonlyMap<number, ShowCatalog>;
  options: ProgressOptions;
  now: number;
};

type Dates = ReadonlySet<number> | ReadonlyMap<number, string> | undefined;
const dateOf = (values: Dates, id: number) => values instanceof Map ? values.get(id) || undefined : undefined;

/**
 * A tab's shows, unsorted and unfiltered, or null until the overlay knows your dropped, rewatching and hidden shows.
 * Watched is the endpoint's shows minus the dropped and hidden ones; Rewatching keeps the ones you're rewatching;
 * Dropped keeps the dropped ones, counting any the endpoint left out from the overlay and their summary. A show whose
 * catalog is loaded (its seasons are open) gets its season lines; the API's counts stay.
 */
export function toProgressItems(
  { type, nitro, droppedShows, slices, catalogs, options, now }: ToProgressItemsParams,
): readonly ProgressItem[] | null {
  const { dropped, rewatching, progressHidden, hidden } = slices;
  if (!dropped || !rewatching || !progressHidden) return null;

  const optimistic = hidden?.get('progress_watched');
  const isHidden = (id: number) => progressHidden.watched.shows.has(id) || Boolean(optimistic?.has(`show:${id}`));
  const keep = (id: number) => {
    if (type === 'dropped') return dropped.has(id);
    if (dropped.has(id) || isHidden(id)) return false;
    return type === 'watched' || rewatching.has(id);
  };
  const listed = new Set(nitro.map(({ show }) => show.id));
  const missing = type === 'dropped'
    ? [...(droppedShows?.values() ?? [])].filter(({ id }) => dropped.has(id) && !listed.has(id))
    : [];

  const counted = (show: CachedShow, base?: ProgressItem): ProgressItem => {
    const resetAt = dateOf(rewatching, show.id);
    const droppedAt = type === 'dropped' ? dateOf(dropped, show.id) : undefined;
    const catalog = catalogs.get(show.id);
    if (base && !catalog) return { ...base, resetAt, droppedAt };
    const item = toProgressItem({
      show,
      watched: slices.watchedShows?.get(show.id),
      collected: slices.collectedShows?.get(show.id),
      resetAt,
      droppedAt,
      hiddenSeasons: progressHidden.watched.seasons.get(show.id),
      catalog,
      includeSpecials: options.includeSpecials,
      useLastActivity: options.useLastActivity,
      now,
    });
    return base ? { ...base, resetAt, droppedAt, detail: item.detail } : item;
  };

  return [
    ...nitro.filter(({ show }) => keep(show.id)).map((item) => counted(item.show, item)),
    ...missing.map((show) => counted(show)),
  ];
}
