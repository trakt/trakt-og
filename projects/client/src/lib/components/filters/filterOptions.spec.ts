import { describe, expect, it } from 'vitest';
import { toCodedOptions, toGenreOptions, toNetworkOptions } from './filterOptions.ts';

describe('util: filterOptions', () => {
  it('should map genres, languages and countries', () => {
    expect(toGenreOptions([{ name: 'Science Fiction', slug: 'science-fiction' }])).toEqual([
      { value: 'science-fiction', label: 'Science Fiction' },
    ]);
    expect(toCodedOptions([{ name: 'Japanese', code: 'ja' }])).toEqual([{ value: 'ja', label: 'Japanese' }]);
  });

  it('should list each network name once, sorted, tagged with its country', () => {
    const body = [
      { name: 'HBO', country: 'us', ids: { trakt: 1 } },
      { name: '', country: null },
      { name: ' ABC ', country: 'au' },
      { name: 'HBO', country: 'gb' },
      { name: 'hbo', country: 'ca' },
    ];
    expect(toNetworkOptions(body)).toEqual([
      { value: 'ABC', label: 'ABC', tag: 'AU' },
      { value: 'HBO', label: 'HBO', tag: 'US' },
    ]);
  });

  it('should throw on a body of the wrong shape', () => {
    expect(() => toGenreOptions({ genres: [] })).toThrow();
  });
});
