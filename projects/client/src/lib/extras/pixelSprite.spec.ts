import { describe, expect, it } from 'vitest';
import { pixelSprite } from './pixelSprite.ts';

describe('pixelSprite', () => {
  it('should turn each row into runs of one color, skipping the empty ones', () => {
    expect(pixelSprite(['.HH.S', 'TTTT.'])).toEqual([
      { x: 1, y: 0, width: 2, key: 'H' },
      { x: 4, y: 0, width: 1, key: 'S' },
      { x: 0, y: 1, width: 4, key: 'T' },
    ]);
  });

  it('should draw nothing for an empty sprite', () => {
    expect(pixelSprite(['....', '....'])).toEqual([]);
  });
});
