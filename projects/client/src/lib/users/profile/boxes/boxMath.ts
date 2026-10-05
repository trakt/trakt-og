const DAY = 86_400_000;

/**
 * The arithmetic every box score shares. A score mixes volume (`cap`, linear up to a "that's a lot" reference, so one
 * huge stat can't drown the rest) with recency (`fresh`, a half-life decay), weighted per box, out of 100.
 */
export const boxMath = {
  /** 0 to 1: `x` against its reference. */
  cap: (x: number, reference: number) => Math.max(0, Math.min(1, x / reference)),
  /** 1 today, halving every `halfLife` days. */
  fresh: (days: number, halfLife: number) => 0.5 ** (Math.max(0, days) / halfLife),
  /** Whole UTC days since 1970. */
  utcDay: (at: Date | string) => Math.floor(new Date(at).getTime() / DAY),
  /** Whole UTC days between a timestamp and `today`. */
  daysAgo: (today: number, at: string) => today - Math.floor(Date.parse(at) / DAY),
};
