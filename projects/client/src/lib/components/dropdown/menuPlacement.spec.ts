import { describe, expect, it } from 'vitest';
import { menuPlacement } from './menuPlacement.ts';

const viewport = { width: 1440, height: 900 };
const menu = { width: 210, height: 300 };

describe('menuPlacement', () => {
  it('should drop the menu under the trigger from its left edge', () => {
    expect(menuPlacement({ trigger: { top: 300, bottom: 334, left: 480 }, menu, viewport, offset: 4 })).toEqual({
      top: 338,
      left: 480,
    });
  });

  it('should open above the trigger when it only fits there', () => {
    expect(menuPlacement({ trigger: { top: 700, bottom: 734, left: 480 }, menu, viewport, offset: 4 })).toEqual({
      top: 396,
      left: 480,
    });
  });

  it('should stay under the trigger when it fits neither way', () => {
    const tall = { width: 210, height: 800 };
    expect(menuPlacement({ trigger: { top: 300, bottom: 334, left: 480 }, menu: tall, viewport, offset: 4 }).top).toBe(
      338,
    );
  });

  it('should pull the menu left to keep it on screen', () => {
    expect(menuPlacement({ trigger: { top: 300, bottom: 334, left: 1300 }, menu, viewport, offset: 4 }).left).toBe(
      1230,
    );
  });
});
