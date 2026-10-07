interface FitScaleParams {
  /** Height the content may use. */
  available: number;
  /** Height the content takes laid out at full size. */
  natural: number;
}

/** How far to shrink content so it fits its height, never enlarging it. */
export function toFitScale({ available, natural }: FitScaleParams): number {
  if (natural <= 0 || available <= 0) return 1;
  return Math.min(1, available / natural);
}
