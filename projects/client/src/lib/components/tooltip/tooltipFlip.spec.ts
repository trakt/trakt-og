import { describe, expect, it } from 'vitest';
import { tooltipFlip } from './tooltipFlip.ts';

const viewport = { width: 1440, height: 900 };

describe('tooltipFlip', () => {
  it('should keep the preferred side when the tooltip fits', () => {
    expect(tooltipFlip({ placement: 'top', box: { top: 10, bottom: 40, left: 0, right: 100 }, viewport })).toBe('top');
  });

  it('should flip a top tooltip that runs off the top of the screen', () => {
    expect(tooltipFlip({ placement: 'top', box: { top: -4, bottom: 30, left: 0, right: 100 }, viewport })).toBe(
      'bottom',
    );
  });

  it('should flip a bottom tooltip that runs off the bottom of the screen', () => {
    expect(tooltipFlip({ placement: 'bottom', box: { top: 870, bottom: 910, left: 0, right: 100 }, viewport })).toBe(
      'top',
    );
  });

  it('should flip a right tooltip that runs off the right edge', () => {
    expect(tooltipFlip({ placement: 'right', box: { top: 10, bottom: 40, left: 1400, right: 1460 }, viewport })).toBe(
      'left',
    );
  });

  it('should ignore overflow on the sides the tooltip does not grow toward', () => {
    expect(tooltipFlip({ placement: 'left', box: { top: -20, bottom: 950, left: 5, right: 100 }, viewport })).toBe(
      'left',
    );
  });
});
