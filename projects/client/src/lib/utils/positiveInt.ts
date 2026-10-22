/** A query param read as a whole number above zero, or the fallback when it's missing, zero, negative or not a number. */
export function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return parsed > 0 ? parsed : fallback;
}
