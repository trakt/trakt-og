import { describe, expect, it } from 'vitest';
import { anchorNames } from './anchorNames.ts';

describe('anchorNames', () => {
  it('should add a name beside the ones already there', () => {
    expect(anchorNames('--rating-s5', { add: '--tooltip-s6' })).toBe('--rating-s5, --tooltip-s6');
  });

  it('should start a list on an element without one', () => {
    expect(anchorNames('', { add: '--tooltip-s6' })).toBe('--tooltip-s6');
    expect(anchorNames('none', { add: '--tooltip-s6' })).toBe('--tooltip-s6');
  });

  it('should take out only the given name', () => {
    expect(anchorNames('--rating-s5, --tooltip-s6', { remove: '--tooltip-s6' })).toBe('--rating-s5');
    expect(anchorNames('--tooltip-s6', { remove: '--tooltip-s6' })).toBe('');
  });

  it('should not add a name twice', () => {
    expect(anchorNames('--tooltip-s6', { add: '--tooltip-s6' })).toBe('--tooltip-s6');
  });
});
