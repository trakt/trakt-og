import { describe, expect, it } from 'vitest';
import { toArcLetters } from './toArcLetters.ts';

const arc = { from: { x: 0, y: 100 }, control: { x: 100, y: 0 }, to: { x: 200, y: 100 } };

describe('toArcLetters', () => {
  it('should put the first and last letters on the arc ends', () => {
    const letters = toArcLetters({ letters: 'ABC', ...arc });

    expect(letters.at(0)).toMatchObject({ letter: 'A', x: 0, y: 100 });
    expect(letters.at(-1)).toMatchObject({ letter: 'C', x: 200, y: 100 });
  });

  it('should level the middle letter at the top of a symmetric arc', () => {
    const middle = toArcLetters({ letters: 'ABC', ...arc }).at(1);

    expect(middle).toMatchObject({ letter: 'B', x: 100, y: 50 });
    expect(middle?.angle).toBeCloseTo(0);
  });

  it('should lean the ends with the curve', () => {
    const letters = toArcLetters({ letters: 'ABC', ...arc });

    expect(letters.at(0)?.angle).toBeCloseTo(-45);
    expect(letters.at(-1)?.angle).toBeCloseTo(45);
  });
});
