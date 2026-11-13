import { type FormatDateOptions, formatDate } from '../utils/formatDate.ts';

/** An air date and its time apart, for a date tag with the time in its own segment: "January 20, 2008" and "9:00 PM". */
export function airDateParts(at: string, options: Omit<FormatDateOptions, 'time'>) {
  const date = formatDate(at, options);
  return {
    date,
    time: formatDate(at, { ...options, time: true })
      .slice(date.length)
      .trim(),
  };
}
