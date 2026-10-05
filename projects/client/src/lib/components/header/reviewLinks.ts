import { traktUrls } from '../../traktUrls.ts';

export type ReviewLink = { readonly title: string; readonly href: string };

/**
 * The profile menu's Year in Review and Month in Review links. Like OG's `year_in_review` and `month_in_review`, they
 * open the current year (last year in January, which has barely any data yet) and last month.
 */
export function reviewLinks({ slug, now }: { slug: string; now: Date }): readonly ReviewLink[] {
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return [
    { title: 'Year in Review', href: traktUrls.yearInReview(slug, year) },
    {
      title: 'Month in Review',
      href: traktUrls.monthInReview(slug, lastMonth.getFullYear(), lastMonth.getMonth() + 1),
    },
  ];
}
