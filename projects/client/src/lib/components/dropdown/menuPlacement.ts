interface MenuPlacementParams {
  readonly trigger: Pick<DOMRect, 'top' | 'bottom' | 'left'>;
  readonly menu: { readonly width: number; readonly height: number };
  readonly viewport: { readonly width: number; readonly height: number };
  /** The gap between the trigger and the menu, and between the menu and the screen edge when it's cut short. */
  readonly offset: number;
}

/**
 * Where a dropdown's menu goes in the viewport: under the trigger from its left edge, above it when it only fits
 * there, and pulled left when it would run off the right edge. When it fits neither way it takes the roomier side
 * with a `maxHeight` that ends it at the screen edge, so it scrolls instead of running off screen.
 */
export function menuPlacement({ trigger, menu, viewport, offset }: MenuPlacementParams) {
  const left = Math.max(0, Math.min(trigger.left, viewport.width - menu.width));
  const below = trigger.bottom + offset;
  const roomBelow = viewport.height - below;
  const roomAbove = trigger.top - offset;
  if (menu.height <= roomBelow) return { top: below, left };
  if (menu.height <= roomAbove) return { top: roomAbove - menu.height, left };
  if (roomBelow >= roomAbove) return { top: below, left, maxHeight: roomBelow - offset };
  return { top: offset, left, maxHeight: roomAbove - offset };
}
