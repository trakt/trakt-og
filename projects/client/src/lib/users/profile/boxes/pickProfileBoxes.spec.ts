import { describe, expect, it } from 'vitest';
import { pickProfileBoxes } from './pickProfileBoxes.ts';

type Group = 'pinned' | 'image' | 'numbers' | 'colour';

// A candidate as `evaluate` returns it. `entry` carries the key so the result reads as a list of keys.
const box = (key: string, group: Group, score: number | null, { floor = false, empty = false } = {}) => ({
  key,
  group,
  floor,
  score,
  entry: empty ? null : key,
});

const pick = (...candidates: ReturnType<typeof box>[]) => pickProfileBoxes(candidates);

describe('pickProfileBoxes', () => {
  it('should keep the four best scores of 40 or more, in registry order', () => {
    expect(pick(
      box('a', 'image', 41),
      box('b', 'colour', 90),
      box('c', 'colour', 39),
      box('d', 'colour', 70),
      box('e', 'image', 80),
      box('f', 'colour', 60),
    )).toEqual(['b', 'd', 'e', 'f']);
  });

  it('should pin a pinned box with a score, whatever the others score', () => {
    expect(pick(
      box('about', 'pinned', 100),
      box('a', 'image', 99),
      box('b', 'colour', 98),
      box('c', 'colour', 97),
      box('d', 'colour', 96),
    )).toEqual(['about', 'a', 'b', 'c']);
  });

  it('should leave out a pinned box without a score unless it fills the floor', () => {
    const rest = [box('a', 'image', 90), box('b', 'colour', 80), box('c', 'colour', 70)];
    expect(pick(box('about', 'pinned', null), ...rest, box('d', 'colour', 60))).toEqual(['a', 'b', 'c', 'd']);
    expect(pick(box('about', 'pinned', null, { floor: true }), ...rest)).toEqual(['about', 'a', 'b', 'c']);
  });

  it('should show at most two numbers boxes', () => {
    expect(pick(
      box('a', 'numbers', 95),
      box('b', 'numbers', 94),
      box('c', 'numbers', 93),
      box('d', 'image', 50),
      box('e', 'colour', 45),
    )).toEqual(['a', 'b', 'd', 'e']);
  });

  it('should swap the lowest pick for the best image box when none made it, even under the bar', () => {
    expect(pick(
      box('a', 'numbers', 90),
      box('b', 'colour', 80),
      box('c', 'colour', 70),
      box('d', 'numbers', 60),
      box('e', 'image', 20),
      box('f', 'image', 10),
    )).toEqual(['a', 'b', 'c', 'e']);
  });

  it('should add the best image box to a free slot instead of swapping', () => {
    expect(pick(box('a', 'numbers', 90), box('b', 'image', 5))).toEqual(['a', 'b']);
  });

  it('should fill the floor in registry order after everything else', () => {
    expect(pick(
      box('about', 'pinned', null, { floor: true }),
      box('last', 'image', 30, { floor: true }),
      box('binge', 'numbers', 75),
      box('time', 'numbers', 20, { floor: true }),
      box('list', 'image', null, { floor: true }),
    )).toEqual(['about', 'last', 'binge', 'time']);
  });

  it('should break ties on registry order', () => {
    expect(pick(
      box('a', 'colour', 50),
      box('b', 'image', 50),
      box('c', 'colour', 50),
      box('d', 'colour', 50),
      box('e', 'colour', 50),
    )).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should skip a box with nothing to show, floor or not', () => {
    expect(pick(box('a', 'image', 90, { empty: true }), box('b', 'colour', null, { floor: true, empty: true })))
      .toEqual([]);
  });
});
