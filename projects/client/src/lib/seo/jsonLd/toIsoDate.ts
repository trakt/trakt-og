/** An API date or timestamp as an ISO 8601 day, `2010-07-16`; undefined when it's missing or invalid. */
export function toIsoDate(date: string | null | undefined): string | undefined {
  if (!date) return undefined;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}
