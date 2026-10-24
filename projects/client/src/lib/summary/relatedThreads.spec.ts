import { describe, expect, it } from 'vitest';
import { relatedThreads } from './relatedThreads.ts';
import type { RelatedCard } from './toRelatedCard.ts';

const card = (id: number, subgenres: readonly string[]): RelatedCard => ({
  type: 'show',
  id,
  href: `/shows/${id}`,
  title: `Show ${id}`,
  released: true,
  subgenres,
});

const source = { subgenres: ['drugs', 'outlaw', 'dark', 'tragedy'], people: [10, 11] };

describe('relatedThreads', () => {
  it('should sort the picks by shared subgenres, ties in the API order', () => {
    const cards = [card(1, ['outlaw']), card(2, ['drugs', 'outlaw']), card(3, ['comedy']), card(4, ['dark'])];
    const { picks } = relatedThreads({ source, cards, people: new Map() });
    expect(picks.map(({ card }) => card.id)).toEqual([2, 1, 4, 3]);
  });

  it('should list the shared subgenres from the most shared down, titled', () => {
    const cards = [card(1, ['outlaw']), card(2, ['drugs', 'outlaw'])];
    const { threads } = relatedThreads({ source, cards, people: new Map() });
    expect(threads).toEqual([
      { id: 'outlaw', label: 'Outlaw', count: 2, people: false },
      { id: 'drugs', label: 'Drugs', count: 1, people: false },
    ]);
  });

  it('should drop a subgenre nearly every pick shares', () => {
    const cards = [1, 2, 3, 4].map((id) => card(id, id === 4 ? ['drugs'] : ['drugs', 'outlaw']));
    const { threads } = relatedThreads({ source, cards, people: new Map() });
    expect(threads.map(({ id }) => id)).toEqual(['outlaw']);
  });

  it('should lead with people once a pick shares some, without moving the picks', () => {
    const cards = [card(1, ['drugs', 'outlaw']), card(2, ['dark'])];
    const people = new Map([
      [
        2,
        [
          { id: 11, name: 'Bob Odenkirk' },
          { id: 99, name: 'Someone Else' },
        ],
      ],
    ]);
    const { threads, picks } = relatedThreads({ source, cards, people });
    expect(threads.at(0)).toEqual({ id: '@people', label: 'People', count: 1, people: true });
    expect(picks.map(({ card }) => card.id)).toEqual([1, 2]);
    expect(picks.at(1)).toMatchObject({ threads: ['@people', 'dark'], people: [{ id: 11, name: 'Bob Odenkirk' }] });
  });
});
