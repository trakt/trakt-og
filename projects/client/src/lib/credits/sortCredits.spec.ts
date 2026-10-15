import { describe, expect, it } from 'vitest';
import { sortCredits } from './sortCredits.ts';

const person = (name: string, role: string, episodeCount?: number) => ({
  id: name.length,
  name,
  href: `/people/${name}`,
  role,
  episodeCount,
});

const walter = person('Bryan Cranston', 'Walter White', 62);
const junior = person('RJ Mitte', 'Walter White Jr.', 62);
const saul = person('Bob Odenkirk', 'Saul Goodman', 43);
const gus = person('Giancarlo Esposito', '', 28);
const people = [walter, saul, gus];
const names = (sorted: readonly { name: string }[]) => sorted.map(({ name }) => name);
const options = { flipped: false, characters: true };

describe('sortCredits', () => {
  it('should keep the billing order, or reverse it', () => {
    expect(names(sortCredits(people, { ...options, by: 'billing' }))).toEqual(names(people));
    expect(names(sortCredits(people, { ...options, by: 'billing', flipped: true }))).toEqual(
      names(people.toReversed()),
    );
  });

  it('should sort names A to Z by last name', () => {
    expect(names(sortCredits([...people, junior], { ...options, by: 'name' }))).toEqual([
      'Bryan Cranston',
      'Giancarlo Esposito',
      'RJ Mitte',
      'Bob Odenkirk',
    ]);
  });

  it('should sort characters by the last name alone, skipping suffixes, ties in billing order, no role last', () => {
    expect(names(sortCredits([junior, gus, walter, saul], { ...options, by: 'role' }))).toEqual([
      'Bob Odenkirk',
      'RJ Mitte',
      'Bryan Cranston',
      'Giancarlo Esposito',
    ]);
  });

  it('should sort several characters by the first one', () => {
    const victor = person('Jeremiah Bitsui', "Gus' Messenger, Victor");

    const hector = person('Mark Margolis', 'Hector Salamanca');

    expect(names(sortCredits([hector, victor], { ...options, by: 'role' }))).toEqual([
      'Jeremiah Bitsui',
      'Mark Margolis',
    ]);
  });

  it('should sort crew jobs by the whole job', () => {
    const crew = [person('Vince Gilligan', 'Writer'), person('Michelle MacLaren', 'Executive Producer')];

    expect(names(sortCredits(crew, { ...options, by: 'role', characters: false }))).toEqual([
      'Michelle MacLaren',
      'Vince Gilligan',
    ]);
  });

  it('should sort episodes most first, then fewest first when flipped', () => {
    expect(names(sortCredits([gus, walter, saul], { ...options, by: 'episodes' }))).toEqual(names(people));
    expect(names(sortCredits([gus, walter, saul], { ...options, by: 'episodes', flipped: true }))).toEqual(
      names(people.toReversed()),
    );
  });
});
