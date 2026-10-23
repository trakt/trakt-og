import { describe, expect, it } from 'vitest';
import { withAlpha } from './withAlpha.ts';

describe('withAlpha', () => {
  it('should turn a hex color into rgba at the opacity', () => {
    expect(withAlpha('#ed1c24', 0.5)).toBe('rgba(237,28,36,0.5)');
    expect(withAlpha(' #6FF3FF', 1)).toBe('rgba(111,243,255,1)');
  });

  it('should leave a color it cannot read alone', () => {
    expect(withAlpha('red', 0.5)).toBe('red');
    expect(withAlpha('#abc', 0.5)).toBe('#abc');
  });
});
