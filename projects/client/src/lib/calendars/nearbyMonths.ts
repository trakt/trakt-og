/** The first days of the months around a month: `before` earlier ones, the month itself, then `after` later ones. */
export function nearbyMonths({ month, before, after }: { month: string; before: number; after: number }): string[] {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1;
  return Array.from({ length: before + after + 1 }, (_, i) => {
    const date = new Date(Date.UTC(year, index + i - before, 1));
    return date.toISOString().slice(0, 10);
  });
}
