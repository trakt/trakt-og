/** A 0 to 1 share as a whole percent, with anything under 1% as "<1%" so a handful of people never reads as a number. */
export const sharePercent = (share: number) => (share < 0.01 ? '<1%' : `${Math.round(share * 100)}%`);
