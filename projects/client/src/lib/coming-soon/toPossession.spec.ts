import { describe, expect, it } from 'vitest';
import { toPossession } from './toPossession.ts';

const letters = [
  { letter: 'B', x: 10, y: 20 },
  { letter: 'O', x: 30, y: 40 },
];
const yes = { x: 1, y: 2 };

describe('toPossession', () => {
  it('should confirm with YES, then visit each letter of the answer in order', () => {
    expect(toPossession({ answer: 'BOO', letters, yes })).toEqual([
      { letter: null, x: 1, y: 2 },
      { letter: 'B', x: 10, y: 20 },
      { letter: 'O', x: 30, y: 40 },
      { letter: 'O', x: 30, y: 40 },
    ]);
  });

  it('should skip letters the board does not have', () => {
    expect(toPossession({ answer: 'B?', letters, yes }).map((step) => step.letter)).toEqual([null, 'B']);
  });
});
