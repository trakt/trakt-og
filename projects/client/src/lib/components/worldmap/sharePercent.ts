const formats = new Map<number, Intl.NumberFormat>();

const formatOf = (digits: number) => {
  const kept = formats.get(digits);
  if (kept) return kept;
  const format = new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  formats.set(digits, format);
  return format;
};

/**
 * A 0 to 1 share as a percent, whole or to `digits` places, with anything under 1% as "<1%" so a handful of people
 * never reads as a number.
 */
export const sharePercent = (share: number, digits = 0) =>
  share < 0.01 ? '<1%' : `${formatOf(digits).format(share * 100)}%`;
