interface MenuPlacementParams {
  readonly trigger: Pick<DOMRect, 'top' | 'bottom' | 'left'>;
  readonly menu: { readonly width: number; readonly height: number };
  readonly viewport: { readonly width: number; readonly height: number };
  /** The gap between the trigger and the menu. */
  readonly offset: number;
}

/**
 * Where a dropdown's menu goes in the viewport: under the trigger from its left edge, above it when it only fits
 * there, and pulled left when it would run off the right edge.
 */
export function menuPlacement({ trigger, menu, viewport, offset }: MenuPlacementParams) {
  const below = trigger.bottom + offset;
  const above = trigger.top - offset - menu.height;
  const fitsBelow = below + menu.height <= viewport.height;
  const top = fitsBelow || above < 0 ? below : above;
  const left = Math.max(0, Math.min(trigger.left, viewport.width - menu.width));
  return { top, left };
}
