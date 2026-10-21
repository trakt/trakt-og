import type { PersonCredit } from './PersonCredit.ts';

export type CreditYear = {
  /** The year, or `undefined` for credits with none yet. */
  readonly year?: number;
  readonly credits: readonly PersonCredit[];
};

/** Runs of credits sharing a year, in the order given, so a released sort reads as one year after another. */
export function groupCreditsByYear(credits: readonly PersonCredit[]): CreditYear[] {
  return credits.reduce<CreditYear[]>((groups, credit) => {
    const last = groups.at(-1);
    if (last && last.year === credit.year) {
      return [...groups.slice(0, -1), { year: last.year, credits: [...last.credits, credit] }];
    }
    return [...groups, { year: credit.year, credits: [credit] }];
  }, []);
}
