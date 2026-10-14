import { describe, expect, it } from 'vitest';
import { listPrivacy } from './listPrivacy.ts';

describe('util: listPrivacy', () => {
  it('should be public for a public list', () => {
    expect(listPrivacy({ isPublic: true, shareLink: false, pills: [] })).toBe('public');
  });

  it('should be link for a share-link list', () => {
    expect(listPrivacy({ isPublic: false, shareLink: true, pills: ['Private'] })).toBe('link');
  });

  it('should be friends for a following-only list', () => {
    expect(listPrivacy({ isPublic: false, shareLink: false, pills: ['Following'] })).toBe('friends');
  });

  it('should be private otherwise', () => {
    expect(listPrivacy({ isPublic: false, shareLink: false, pills: ['Private'] })).toBe('private');
  });
});
