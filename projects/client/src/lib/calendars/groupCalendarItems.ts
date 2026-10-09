import type { CalendarItem } from './calendarDays.ts';

/** One card's worth of a day: a movie, an episode, or every episode of one show that day. */
export type CalendarGroup = { readonly key: string; readonly items: readonly CalendarItem[] };

const showOf = (item: CalendarItem) => (item.type === 'episode' ? item.show.ids.trakt : undefined);
const order = (a: CalendarItem, b: CalendarItem) =>
  a.type === 'episode' && b.type === 'episode'
    ? a.episode.season - b.episode.season || a.episode.number - b.episode.number
    : 0;

function keyOf(items: readonly CalendarItem[]): string {
  const first = items.at(0);
  if (!first) return 'empty';
  if (first.type === 'movie') return `movie-${first.movie.ids.trakt}`;
  return items.length > 1
    ? `group-${first.show.ids.trakt}-${first.episode.ids.trakt}`
    : `episode-${first.episode.ids.trakt}`;
}

/**
 * A day's entries as cards. With `grouped`, a show's episodes on the same day share one card (a binge drop or a
 * double episode), placed where its first episode aired and ordered by season and number. Without it, every entry is
 * its own card, as OG had it.
 */
export function groupCalendarItems(items: readonly CalendarItem[], grouped: boolean): CalendarGroup[] {
  if (!grouped) return items.map((item) => ({ key: keyOf([item]), items: [item] }));

  const shows = [...new Set(items.map(showOf).filter((id) => id !== undefined))];
  const byShow = new Map(shows.map((id) => [id, items.filter((item) => showOf(item) === id).toSorted(order)]));

  return items.flatMap((item, index) => {
    const show = showOf(item);
    if (show === undefined) return [{ key: keyOf([item]), items: [item] }];
    if (items.findIndex((other) => showOf(other) === show) !== index) return [];
    const episodes = byShow.get(show) ?? [item];
    return [{ key: keyOf(episodes), items: episodes }];
  });
}
