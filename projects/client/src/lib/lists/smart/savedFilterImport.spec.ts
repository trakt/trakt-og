import { describe, expect, it } from 'vitest';
import { savedFilterImport } from './savedFilterImport.ts';

const now = new Date('2026-11-02T12:00:00Z');
const saved = [
  { name: 'HBO Dramas', path: '/shows/trending', query: 'genres=drama' },
  { name: 'Short Comedies', path: '/movies/popular', query: 'genres=comedy&runtimes=60-95' },
  { name: 'Network', path: '/shows/trending', query: 'network_ids=16' },
];

describe('util: savedFilterImport', () => {
  it('should offer the filters that can become smart lists and count the rest', () => {
    const offer = savedFilterImport({ saved, existing: [], now });
    expect(offer?.lists.map(({ name }) => name)).toEqual(['HBO Dramas', 'Short Comedies']);
    expect(offer?.skipped).toBe(1);
  });

  it('should leave out filters already brought over, by name', () => {
    const offer = savedFilterImport({ saved, existing: [{ name: ' hbo dramas' }], now });
    expect(offer?.lists.map(({ name }) => name)).toEqual(['Short Comedies']);
  });

  it('should offer nothing when nothing can come back', () => {
    expect(savedFilterImport({ saved: saved.slice(2), existing: [], now })).toBeNull();
    expect(savedFilterImport({ saved: [], existing: [], now })).toBeNull();
  });
});
