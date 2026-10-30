import type { DateOrder } from '../utils/formatDate.ts';
import type { DatePreferences } from './DatePreferences.ts';
import type { ViewerSettings } from './ViewerSettings.ts';

type DateSettings = {
  readonly account?: Pick<ViewerSettings['account'], 'date_format' | 'time_24hr'> | null;
  readonly browsing?: { readonly week_start_day?: string | null } | null;
};

function dateOrder(order: string | undefined): DateOrder {
  return order === 'dmy' || order === 'ymd' || order === 'ydm' ? order : 'mdy';
}

function weekStartDay(day: string | null | undefined): DatePreferences['weekStartDay'] {
  if (!day || !/^[0-6]$/.test(day)) return 0;
  return Number(day) as DatePreferences['weekStartDay'];
}

/**
 * OG defaults to month/day/year, 12 hours and Sunday. Like V3, dates use the browser's zone (`browserTimeZone`), not
 * the account's: the API answers London for an account with none. Without the cookie, UTC keeps SSR and hydration
 * identical until the layout saves it.
 */
export function toDatePreferences(settings: DateSettings | null, browserZone?: string): DatePreferences {
  return {
    order: dateOrder(settings?.account?.date_format),
    hour24: settings?.account?.time_24hr === true,
    timeZone: browserZone ?? 'UTC',
    weekStartDay: weekStartDay(settings?.browsing?.week_start_day),
  };
}
