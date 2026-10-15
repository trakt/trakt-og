/**
 * An element can anchor several things at once (a rating popover and its trigger's tooltip), so a tooltip adds its
 * name to the element's `anchor-name` list and later takes only its own back out. Returns the new list, or an empty
 * string when nothing is left.
 */
export function anchorNames(current: string, change: { readonly add?: string; readonly remove?: string }): string {
  const names = current.split(',').map((name) => name.trim()).filter((name) => name && name !== 'none')
    .filter((name) => name !== change.remove && name !== change.add);

  return (change.add ? [...names, change.add] : names).join(', ');
}
