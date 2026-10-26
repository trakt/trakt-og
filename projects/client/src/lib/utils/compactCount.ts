const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** A count as Trending's Live now pills read it: 950, 12.7K, 219K, 1.2M. */
export const compactCount = (n: number) => compact.format(n);
