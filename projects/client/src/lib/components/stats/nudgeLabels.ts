type Label = { readonly id: string; readonly at: number };

type Params = {
  labels: readonly Label[];
  /** The closest two labels may sit, in percent of the plot's height. */
  gap: number;
};

/**
 * Where the direct labels at the lines' right ends go: each at its line's height, pushed apart so none overlaps,
 * upward first and then back down if the top one would leave the plot.
 */
export function nudgeLabels({ labels, gap }: Params): readonly Label[] {
  const up = [...labels]
    .sort((a, b) => a.at - b.at)
    .reduce<Label[]>((placed, label) => {
      const floor = (placed.at(-1)?.at ?? -Infinity) + gap;
      return [...placed, { ...label, at: Math.max(label.at, floor) }];
    }, []);
  return up.reduceRight<Label[]>((placed, label) => {
    const ceiling = (placed.at(0)?.at ?? Infinity) - gap;
    return [{ ...label, at: Math.min(label.at, ceiling, 100) }, ...placed];
  }, []);
}
