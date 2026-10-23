const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/**
 * `/users/:id/stats`'s `ratings.distribution` as counts for ratings 1 to 10 (missing ones as zero), their total and
 * average (0 with none), the tallest count and the most given rating, the highest one on a tie.
 */
export function ratingDistribution(distribution: Readonly<Record<string, number>> | undefined) {
  const counts = RATINGS.map((rating) => distribution?.[rating] ?? 0);
  const total = counts.reduce((sum, n) => sum + n, 0);
  const average = total === 0 ? 0 : counts.reduce((sum, n, i) => sum + n * (i + 1), 0) / total;
  const most = Math.max(...counts);
  const mostGiven = RATINGS.findLast((rating) => counts.at(rating - 1) === most) ?? 10;
  return { counts, total, average, most, mostGiven };
}
