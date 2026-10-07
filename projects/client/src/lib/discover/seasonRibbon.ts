import type { DiscoverTheme } from './discoverThemes.ts';

export type SeasonMonth = {
  /** The month's theme, which picks its accent. */
  readonly id: string;
  /** "Jan". */
  readonly month: string;
  readonly title: string;
  /** How far through the month today is, 0 to 1: 1 for months gone by, 0 for those to come. */
  readonly progress: number;
  /** Today's month only: the days left in it, today included. */
  readonly daysLeft?: number;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * The month map as a year: each month's theme (the one that starts in it, not the events), how far through it today
 * is, and the days left in today's month.
 */
export function seasonRibbon(themes: readonly DiscoverTheme[], today: string): SeasonMonth[] {
  const [year, month, day] = today.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year ?? 0, month ?? 0, 0)).getUTCDate();
  return MONTHS.flatMap((name, index) => {
    const number = index + 1;
    const theme = themes.find((candidate) => !candidate.event && Number(candidate.start.slice(0, 2)) === number);
    if (!theme) return [];
    if (number !== month) {
      return [{ id: theme.id, month: name, title: theme.title, progress: number < (month ?? 0) ? 1 : 0 }];
    }
    return [{
      id: theme.id,
      month: name,
      title: theme.title,
      progress: (day ?? 0) / daysInMonth,
      daysLeft: daysInMonth - (day ?? 0) + 1,
    }];
  });
}
