import { describe, expect, it } from 'vitest';
import { toSmartListRow } from './toSmartListRow.ts';

const profile = { slug: 'justin', displayName: 'Justin', avatarUrl: 'avatar.jpg', vip: null };
const list = {
  id: 5716,
  slug: 'family-friendly-2dec46d4d59a4d7f',
  name: 'Family Friendly',
  privacy: 'public' as const,
  source: 'popular' as const,
  mediaType: 'shows' as const,
  filters: { certifications: ['tv-g'] },
  updatedAt: '2026-07-16T01:27:46.000Z',
  posters: [],
};

describe('mapper: toSmartListRow', () => {
  it('should map a smart list to a row with its tag and source', () => {
    const row = toSmartListRow({ list, profile, rank: 2 });
    expect(row).toMatchObject({
      key: 'smart-5716',
      id: null,
      kind: 'smart',
      href: '/users/justin/smart-lists/family-friendly-2dec46d4d59a4d7f',
      name: 'Family Friendly',
      pills: ['Smart'],
      description: 'Fills itself from Popular shows.',
      isPublic: true,
      updatedAt: '2026-07-16T01:27:46.000Z',
      rank: 2,
    });
    expect(row.owner).toEqual({
      slug: 'justin',
      name: 'Justin',
      href: '/users/justin',
      avatar: 'avatar.jpg',
      vip: null,
    });
  });

  it.each([
    ['private', ['Smart', 'Private']],
    ['friends', ['Smart', 'Following']],
  ] as const)('should tag a %s list', (privacy, pills) => {
    expect(toSmartListRow({ list: { ...list, privacy }, profile, rank: 1 }).pills).toEqual(pills);
  });
});
