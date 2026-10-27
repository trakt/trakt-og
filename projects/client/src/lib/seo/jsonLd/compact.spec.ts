import { describe, expect, it } from 'vitest';
import { compact } from './compact.ts';

describe('seo: compact', () => {
  it('should drop null, undefined, empty strings and empty arrays', () => {
    expect(compact({ a: 1, b: null, c: undefined, d: '', e: [], f: ['x'], g: 0, h: false })).toEqual({
      a: 1,
      f: ['x'],
      g: 0,
      h: false,
    });
  });
});
