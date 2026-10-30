/** A copy of `items` with the item at `from` moved to `to`. Out-of-range indexes return the items unchanged. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const inRange = (index: number) => index >= 0 && index < items.length;
  if (!inRange(from) || !inRange(to) || from === to) return [...items];

  const rest = items.filter((_, index) => index !== from);
  return [...rest.slice(0, to), ...items.slice(from, from + 1), ...rest.slice(to)];
}
