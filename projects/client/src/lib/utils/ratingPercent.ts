/** A 0-10 rating as OG's whole percentage, truncated so 7.99 reads 79%, not 80%. */
export const ratingPercent = (rating: number) => Math.trunc(rating * 10);
