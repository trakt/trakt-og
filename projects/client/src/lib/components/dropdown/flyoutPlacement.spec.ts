import { describe, expect, it } from 'vitest';
import { flyoutPlacement } from './flyoutPlacement.ts';

const viewport = { width: 1440, height: 900 };
const flyout = { width: 200, height: 120 };

describe('util: flyoutPlacement', () => {
  it('should open off the row’s right edge, its first row level with it', () => {
    expect(flyoutPlacement({ row: { top: 300, left: 100, right: 300 }, flyout, viewport, inset: 7 })).toEqual({
      top: 293,
      left: 300,
    });
  });

  it('should open to the left when the right has no room', () => {
    expect(flyoutPlacement({ row: { top: 300, left: 1200, right: 1400 }, flyout, viewport, inset: 7 })).toEqual({
      top: 293,
      left: 1000,
    });
  });

  it('should stay on screen near the bottom', () => {
    expect(flyoutPlacement({ row: { top: 850, left: 100, right: 300 }, flyout, viewport, inset: 7 }).top).toBe(780);
  });
});
