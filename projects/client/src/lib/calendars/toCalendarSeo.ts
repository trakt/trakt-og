type Params = {
  target: 'all' | 'my';
  calendar: { readonly label: string };
  /** The month's first day, `YYYY-MM-DD`. */
  start: string;
};

const monthName = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

/** A calendar page's head: the calendar and the month it shows. */
export function toCalendarSeo({ target, calendar, start }: Params): { title: string; description: string } {
  const month = `${monthName(start)} ${start.slice(0, 4)}`;
  return {
    title: `${target === 'my' ? 'My ' : ''}${calendar.label} Calendar · ${month}`,
    description: `What's on the ${calendar.label} calendar in ${month}, day by day, on Trakt.`,
  };
}
