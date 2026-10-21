/** One place in a number turning over: the digit it was and the digit it becomes, empty where it had none. */
export type AgeDigit = { readonly from: string; readonly to: string };

/** The digits of an age turning over, aligned from the right, so 99 to 100 rolls all three places. */
export function toAgeDigits(from: number, to: number): AgeDigit[] {
  const next = String(to);
  const previous = String(from).padStart(next.length, ' ');
  return [...next].map((digit, i) => ({ from: previous[i]?.trim() ?? '', to: digit }));
}
