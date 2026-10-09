import type { AdvancedFilters } from '../components/filters/advancedFilters.ts';
import type { CalendarItem } from './calendarDays.ts';

/** the worker returns the full window, so terms and episode types need no extran API or pagination. */
export function matchesCalendarFilters(item: CalendarItem, filters: AdvancedFilters): boolean {
  const media = item.type === 'episode' ? item.show : item.movie;
  const text = [
    media.title,
    media.overview,
    ...(item.type === 'episode' ? [item.episode.title, item.episode.overview] : []),
  ]
    .join(' ').toLocaleLowerCase('en');
  const terms = filters.query.toLocaleLowerCase('en').split(/\s+/).filter(Boolean);
  if (!terms.every((term) => text.includes(term))) return false;
  // Episode type filters leave movies alone on the mixed calendar, as OG's episode-only condition did.
  if (item.type !== 'episode') return true;
  const { values, mode, excluded = [] } = filters.episode_types;
  const type = item.episode.episode_type ?? 'standard';
  if (excluded.includes(type)) return false;
  if (values.length === 0) return true;
  return mode === 'none' ? !values.includes(type) : values.includes(type);
}
