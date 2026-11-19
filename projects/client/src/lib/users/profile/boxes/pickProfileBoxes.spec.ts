import { describe, expect, it } from 'vitest';
import { pickProfileBoxes } from './pickProfileBoxes.ts';

type Group = 'image' | 'numbers' | 'colour';

// A candidate as `evaluate` returns it. `entry` carries the key so the result reads as a list of keys.
const box = (
  key: string,
  group: Group,
  score: number | null,
  { floor = false, empty = false, pinned = false, fallback = false, at = undefined as number | undefined } = {},
) => ({
  key,
  group,
  pinned,
  at,
  fallback,
  floor,
  score,
  entry: empty ? null : key,
});

const pick = (...candidates: ReturnType<typeof box>[]) => pickProfileBoxes(candidates).shown;

describe('pickProfileBoxes', () => {
  it('should keep the four best scores of 40 or more, in registry order', () => {
    expect(
      pick(
        box('a', 'image', 41),
        box('b', 'colour', 90),
        box('c', 'colour', 39),
        box('d', 'colour', 70),
        box('e', 'image', 80),
        box('f', 'colour', 60),
      ),
    ).toEqual(['b', 'd', 'e', 'f']);
  });

  it('should pin a pinned box with a score, whatever the others score', () => {
    expect(
      pick(
        box('about', 'colour', 100, { pinned: true }),
        box('a', 'image', 99),
        box('b', 'colour', 98),
        box('c', 'colour', 97),
        box('d', 'colour', 96),
      ),
    ).toEqual(['about', 'a', 'b', 'c']);
  });

  it('should leave out a pinned box without a score unless it fills the floor', () => {
    const rest = [box('a', 'image', 90), box('b', 'colour', 80), box('c', 'colour', 70)];
    expect(pick(box('about', 'colour', null, { pinned: true }), ...rest, box('d', 'colour', 60))).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
    expect(pick(box('about', 'colour', null, { floor: true, pinned: true }), ...rest)).toEqual([
      'about',
      'a',
      'b',
      'c',
    ]);
  });

  it('should only take a fallback box for a slot nothing else clears the bar for', () => {
    const rest = [box('a', 'image', 90), box('b', 'colour', 80), box('c', 'colour', 70)];
    const ratings = box('ratings', 'numbers', 99, { fallback: true });
    expect(pick(ratings, ...rest, box('d', 'colour', 41))).toEqual(['a', 'b', 'c', 'd']);
    expect(pick(ratings, ...rest, box('d', 'colour', 39), box('e', 'colour', null, { floor: true }))).toEqual([
      'ratings',
      'a',
      'b',
      'c',
    ]);
  });

  it('should keep the next four scored boxes for the More row, in registry order', () => {
    const { more } = pickProfileBoxes([
      box('a', 'image', 90),
      box('b', 'colour', 80),
      box('c', 'colour', 70),
      box('d', 'colour', 60),
      box('e', 'colour', 10),
      box('f', 'image', 50),
      box('g', 'colour', null),
      box('h', 'numbers', 30),
      box('i', 'colour', 5),
      box('j', 'colour', 20),
    ]);
    expect(more).toEqual(['e', 'f', 'h', 'j']);
  });

  it('should put a box with a place there, or last in a shorter strip', () => {
    const time = box('time', 'numbers', 0, { pinned: true, at: 2 });
    expect(pick(time, box('a', 'image', 90), box('b', 'colour', 80), box('c', 'colour', 70))).toEqual([
      'a',
      'b',
      'time',
      'c',
    ]);
    expect(pick(time, box('a', 'image', 90))).toEqual(['a', 'time']);
  });

  it('should count a pinned numbers box toward the two', () => {
    expect(
      pick(
        box('time', 'numbers', 0, { pinned: true }),
        box('a', 'numbers', 95),
        box('b', 'numbers', 94),
        box('c', 'image', 60),
        box('d', 'colour', 50),
      ),
    ).toEqual(['time', 'a', 'c', 'd']);
  });

  it('should show at most two numbers boxes', () => {
    expect(
      pick(
        box('a', 'numbers', 95),
        box('b', 'numbers', 94),
        box('c', 'numbers', 93),
        box('d', 'image', 50),
        box('e', 'colour', 45),
      ),
    ).toEqual(['a', 'b', 'd', 'e']);
  });

  it('should swap the lowest pick for the best image box when none made it, even under the bar', () => {
    expect(
      pick(
        box('a', 'numbers', 90),
        box('b', 'colour', 80),
        box('c', 'colour', 70),
        box('d', 'numbers', 60),
        box('e', 'image', 20),
        box('f', 'image', 10),
      ),
    ).toEqual(['a', 'b', 'c', 'e']);
  });

  it('should add the best image box to a free slot instead of swapping', () => {
    expect(pick(box('a', 'numbers', 90), box('b', 'image', 5))).toEqual(['a', 'b']);
  });

  it('should fill the floor in registry order after everything else', () => {
    expect(
      pick(
        box('about', 'colour', null, { floor: true, pinned: true }),
        box('last', 'image', 30, { floor: true }),
        box('binge', 'numbers', 75),
        box('time', 'numbers', 20, { floor: true }),
        box('list', 'image', null, { floor: true }),
      ),
    ).toEqual(['about', 'last', 'binge', 'time']);
  });

  it('should break ties on registry order', () => {
    expect(
      pick(
        box('a', 'colour', 50),
        box('b', 'image', 50),
        box('c', 'colour', 50),
        box('d', 'colour', 50),
        box('e', 'colour', 50),
      ),
    ).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should skip a box with nothing to show, floor or not', () => {
    expect(
      pick(box('a', 'image', 90, { empty: true }), box('b', 'colour', null, { floor: true, empty: true })),
    ).toEqual([]);
  });
});
