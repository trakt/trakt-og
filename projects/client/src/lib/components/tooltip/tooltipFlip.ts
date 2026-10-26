import type { TooltipPlacement } from './TooltipPlacement.ts';

const OPPOSITE: Readonly<Record<TooltipPlacement, TooltipPlacement>> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

type TooltipFlipParams = {
  placement: TooltipPlacement;
  /** The open tooltip's box, on its preferred side. */
  box: Readonly<{ top: number; bottom: number; left: number; right: number }>;
  viewport: Readonly<{ width: number; height: number }>;
};

/** The side a tooltip shows on: its preferred one, or the opposite one when it runs off the screen there. */
export function tooltipFlip({ placement, box, viewport }: TooltipFlipParams): TooltipPlacement {
  const off = {
    top: box.top < 0,
    bottom: box.bottom > viewport.height,
    left: box.left < 0,
    right: box.right > viewport.width,
  }[placement];
  return off ? OPPOSITE[placement] : placement;
}
