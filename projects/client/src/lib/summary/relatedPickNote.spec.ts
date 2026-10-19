import { describe, expect, it } from 'vitest';
import type { RelatedPick } from './RelatedPick.ts';
import { relatedPickNote } from './relatedPickNote.ts';

const threads = [
  { id: '@people', label: 'People', count: 1, people: true },
  { id: 'drug-dealer', label: 'Drug Dealer', count: 5, people: false },
  { id: 'outlaw', label: 'Outlaw', count: 4, people: false },
];
const pick = (ids: readonly string[], names: readonly string[] = []): RelatedPick => ({
  card: { type: 'show', id: 1, href: '/shows/1', title: 'Show', released: true, subgenres: [] },
  threads: ids,
  people: names.map((name, id) => ({ id, name })),
});

describe('relatedPickNote', () => {
  it('should name the first person and count the rest', () => {
    const note = relatedPickNote({ pick: pick(['@people', 'outlaw'], ['Bob Odenkirk', 'Jonathan Banks']), threads });
    expect(note).toEqual({ shared: 2, total: 3, detail: 'Bob Odenkirk +1' });
  });

  it('should name the most shared subgenre without people', () => {
    expect(relatedPickNote({ pick: pick(['drug-dealer', 'outlaw']), threads }).detail).toBe('Drug Dealer');
  });

  it("should name the filter's thread when the pick has it", () => {
    const note = relatedPickNote({ pick: pick(['@people', 'outlaw'], ['Bob Odenkirk']), threads, filter: 'outlaw' });
    expect(note.detail).toBe('Outlaw');
  });

  it('should only count when nothing is shared', () => {
    expect(relatedPickNote({ pick: pick([]), threads })).toEqual({ shared: 0, total: 3 });
  });
});
