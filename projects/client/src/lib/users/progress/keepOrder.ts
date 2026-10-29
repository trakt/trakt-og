type Ordered = { readonly show: { readonly id: number } };

/**
 * `items` in the order `ids` had them, so a reload after a watch leaves each show where it was. Shows `ids` doesn't
 * know go after the rest, in their own order.
 */
export function keepOrder<T extends Ordered>(items: readonly T[], ids: readonly number[]): readonly T[] {
  const at = new Map(ids.map((id, index) => [id, index]));
  const position = ({ show }: T) => at.get(show.id) ?? ids.length;
  return items.toSorted((a, b) => position(a) - position(b));
}
