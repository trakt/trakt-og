import { describe, expect, it } from 'vitest';
import { opensElsewhere } from './opensElsewhere.ts';

const plain = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };

describe('opensElsewhere', () => {
  it('should leave a plain primary click to the page', () => {
    expect(opensElsewhere(plain)).toBe(false);
  });

  it.each([
    ['a middle click', { button: 1 }],
    ['a command click', { metaKey: true }],
    ['a control click', { ctrlKey: true }],
    ['a shift click', { shiftKey: true }],
    ['an option click', { altKey: true }],
  ])('should leave %s to the browser', (_, click) => {
    expect(opensElsewhere({ ...plain, ...click })).toBe(true);
  });
});
