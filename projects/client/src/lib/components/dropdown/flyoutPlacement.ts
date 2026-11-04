type Box = { readonly top: number; readonly left: number; readonly right: number };
type Size = { readonly width: number; readonly height: number };

type FlyoutPlacementParams = {
  /** The row that opens it. */
  row: Box;
  flyout: Size;
  viewport: Size;
  /** The flyout's own padding and border, so its first row lines up with the row that opened it. */
  inset: number;
};

/**
 * Where a flyout menu goes: off the row's right edge, overlapping the menu's padding so the pointer never leaves the
 * row on its way in, or off its left edge when there's no room on the right. Kept on screen top to bottom.
 */
export function flyoutPlacement({ row, flyout, viewport, inset }: FlyoutPlacementParams) {
  const left = row.right + flyout.width <= viewport.width ? row.right : Math.max(0, row.left - flyout.width);
  const top = Math.max(0, Math.min(row.top - inset, viewport.height - flyout.height));
  return { top, left };
}
