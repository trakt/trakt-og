import type { Promotion } from './Promotion.ts';

const PLAN_NAMES: Record<string, string> = {
  monthly: '1 month',
  yearly: '1 year',
  two_years: '2 years',
  three_years: '3 years',
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** The plan's length ("2 years") and the offer price ("$70"), which the header pill sets on two short lines. */
export function offerLines({ plan }: Pick<Promotion, 'plan'>) {
  return {
    term: PLAN_NAMES[plan.duration] ?? `${plan.months_in_term} months`,
    price: money(plan.discounted_amount, plan.currency),
  };
}
