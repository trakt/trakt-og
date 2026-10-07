import { describe, expect, it } from 'vitest';
import { teasers } from './teasers.ts';
import { toNextTeaser } from './toNextTeaser.ts';

const rolls = [0, 0.2, 0.4, 0.6, 0.8, 0.999];

describe('toNextTeaser', () => {
  it('should never repeat the design shown last', () => {
    teasers.forEach((previous) => {
      rolls.forEach((roll) => expect(toNextTeaser({ previous, roll })).not.toBe(previous));
    });
  });

  it('should reach every other design across the roll range', () => {
    const picks = new Set(rolls.map((roll) => toNextTeaser({ previous: 'lobby', roll })));

    expect([...picks].sort()).toEqual(['seance', 'tabloid', 'vhs']);
  });

  it('should pick from all designs on a first visit or an unknown cookie', () => {
    expect(toNextTeaser({ previous: undefined, roll: 0 })).toBe('lobby');
    expect(toNextTeaser({ previous: 'zombie', roll: 0.999 })).toBe('tabloid');
  });

  it('should stay in range when the roll is out of bounds', () => {
    expect(toNextTeaser({ previous: 'lobby', roll: 1 })).toBe('tabloid');
    expect(toNextTeaser({ previous: 'lobby', roll: -1 })).toBe('vhs');
  });
});
