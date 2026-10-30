/**
 * Watched times for episodes seen in one sitting, oldest first: the last ends at `end` and each earlier one a runtime
 * before the next, so history keeps them in order. Without a runtime they all share `end`.
 */
export function backToBack({ count, end, runtime = 0 }: { count: number; end: string; runtime?: number }): string[] {
  const last = Date.parse(end);
  return Array.from({ length: count }, (_, index) =>
    new Date(last - (count - 1 - index) * runtime * 60_000).toISOString(),
  );
}
