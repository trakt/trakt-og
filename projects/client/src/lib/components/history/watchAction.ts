/**
 * Completed/partial history takes priority over the default date; the side button always asks. A rewatch's next
 * episode adds like an unwatched one, its plays being from before the rewatch.
 */
export function watchAction({
  fill,
  force,
  defaultAt,
  rewatchNext,
}: {
  fill: number;
  force: boolean;
  defaultAt?: string | null;
  rewatchNext?: boolean;
}) {
  if (force) return 'date';
  if (!rewatchNext && fill >= 1) return 'remove';
  if (!rewatchNext && fill > 0) return 'partial';
  if (defaultAt === 'now' || defaultAt === 'released' || defaultAt === 'unknown') return defaultAt;
  return 'date';
}
