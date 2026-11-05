import type { TooltipPlacement } from './TooltipPlacement.ts';

const OPPOSITE: Readonly<Record<TooltipPlacement, TooltipPlacement>> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** Sub-pixel rounding between the tooltip's edge and its trigger's, which isn't an overlap. */
const SLACK = 1;

type Box = Readonly<{ top: number; bottom: number; left: number; right: number }>;

type TooltipFlipParams = {
  placement: TooltipPlacement;
  /** The open tooltip's box, on its preferred side. */
  box: Box;
  viewport: Readonly<{ width: number; height: number }>;
  /**
   * The trigger's box. The browser slides a tooltip too big for the room on its side back onto the screen, over the
   * trigger, so covering it counts as running off.
   */
  anchor?: Box;
};

/** The side a tooltip shows on: its preferred one, or the opposite one when it runs off the screen there. */
export function tooltipFlip({ placement, box, viewport, anchor }: TooltipFlipParams): TooltipPlacement {
  const off = {
    top: box.top < 0 || (anchor !== undefined && box.bottom - anchor.top > SLACK),
    bottom: box.bottom > viewport.height || (anchor !== undefined && anchor.bottom - box.top > SLACK),
    left: box.left < 0 || (anchor !== undefined && box.right - anchor.left > SLACK),
    right: box.right > viewport.width || (anchor !== undefined && anchor.right - box.left > SLACK),
  }[placement];
  return off ? OPPOSITE[placement] : placement;
}
