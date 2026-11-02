import { describe, expect, it } from 'vitest';
import { toSmartList } from './toSmartList.ts';

const response = {
  name: 'Family Friendly',
  privacy: 'public',
  created_at: '2026-07-16T01:27:46.000Z',
  updated_at: '2026-07-16T01:27:46.000Z',
  ids: { slug: 'family-friendly-2dec46d4d59a4d7f', trakt: 5716 },
  images: { posters: [] },
  source: 'popular',
  media_type: 'shows',
  filters: { certifications: ['tv-g', 'tv-y', 'tv-y7'] },
};

describe('mapper: toSmartList', () => {
  it('should map a smart list definition', () => {
    expect(toSmartList(response)).toEqual({
      id: 5716,
      slug: 'family-friendly-2dec46d4d59a4d7f',
      name: 'Family Friendly',
      privacy: 'public',
      source: 'popular',
      mediaType: 'shows',
      filters: { certifications: ['tv-g', 'tv-y', 'tv-y7'] },
      updatedAt: '2026-07-16T01:27:46.000Z',
      posters: [],
    });
  });

  it('should fall back for values the contract leaves open', () => {
    const list = toSmartList({ ...response, privacy: 'link', source: 'new-source', media_type: 'episodes' });
    expect([list.privacy, list.source, list.mediaType]).toEqual(['private', 'discover', 'media']);
  });
});
