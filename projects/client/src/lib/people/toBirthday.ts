type ToBirthdayParams = {
  /** `YYYY-MM-DD`. */
  readonly birthday?: string | null;
  readonly death?: string | null;
  /** The viewer's date, `YYYY-MM-DD`, so the day turns at their midnight. */
  readonly today: string;
};

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * The birthday being celebrated today, with the age turned, or `undefined` on any other day. Nobody who has died is
 * celebrated. A February 29 birthday falls on February 28 in other years.
 */
export function toBirthday({ birthday, death, today }: ToBirthdayParams): { readonly age: number } | undefined {
  if (!birthday || death) return undefined;

  const year = Number(today.slice(0, 4));
  const day = birthday.slice(5, 10) === '02-29' && !isLeapYear(year) ? '02-28' : birthday.slice(5, 10);
  if (day !== today.slice(5, 10)) return undefined;

  const age = year - Number(birthday.slice(0, 4));
  return age > 0 ? { age } : undefined;
}
