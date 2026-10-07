import type { DiscoverTheme } from './discoverThemes.ts';

// `MM-DD` falls in `start` to `end`, inclusive. An end before the start wraps the new year.
const covers = ({ start, end }: Pick<DiscoverTheme, 'start' | 'end'>, monthDay: string) =>
  start <= end ? start <= monthDay && monthDay <= end : monthDay >= start || monthDay <= end;

/**
 * The theme for a day (`YYYY-MM-DD`): an event running that day, or else the month's theme. Undefined when nothing
 * covers the day, which the month map's spec rules out.
 */
export function themeFor(themes: readonly DiscoverTheme[], day: string): DiscoverTheme | undefined {
  const monthDay = day.slice(5);
  const running = themes.filter((theme) => covers(theme, monthDay));
  return running.find((theme) => theme.event) ?? running.at(0);
}
