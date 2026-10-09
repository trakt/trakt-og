import type { CalendarDay } from './calendarDays.ts';
import type { CalendarGroup } from './groupCalendarItems.ts';

type GroupLabelParams = {
  group: CalendarGroup;
  /** Every day on the page, to tell a whole season from one batch of several. */
  days: readonly CalendarDay[];
};

const plural = (count: number) => `${count} episodes`;

/**
 * What a grouped card says about its episodes: "Double episode" for two, "Batch 2 of 3 · 5 episodes" when the season
 * drops in several batches on the page, "Full season · 8 episodes" when it starts at episode 1 and nothing more of it
 * airs later on the page, else the count. A single entry has no label.
 */
export function groupLabel({ group, days }: GroupLabelParams): string | undefined {
  const first = group.items.at(0);
  if (!first || first.type !== 'episode' || group.items.length < 2) return undefined;
  if (group.items.length === 2) return 'Double episode';

  const sameSeason = (day: CalendarDay) =>
    day.items.filter((item) =>
      item.type === 'episode' && item.show.ids.trakt === first.show.ids.trakt &&
      item.episode.season === first.episode.season
    ).length;
  const counts = days.map((day) => ({ date: day.date, count: sameSeason(day) })).filter(({ count }) => count > 0);
  const batches = counts.filter(({ count }) => count > 1);
  const firstId = first.episode.ids.trakt;
  const date = days.find((day) =>
    day.items.some((item) => item.type === 'episode' && item.episode.ids.trakt === firstId)
  )
    ?.date;
  const batch = batches.findIndex((day) => day.date === date);

  if (batches.length > 1 && batch >= 0) {
    return `Batch ${batch + 1} of ${batches.length} · ${plural(group.items.length)}`;
  }
  const later = counts.some((day) => date !== undefined && day.date > date);
  if (first.episode.number === 1 && !later) return `Full season · ${plural(group.items.length)}`;
  return plural(group.items.length);
}
