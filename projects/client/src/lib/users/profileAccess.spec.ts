import { describe, expect, it } from 'vitest';
import { profileAccess } from './profileAccess.ts';

describe('util: profileAccess', () => {
  it('should read a public profile without the token', () => {
    expect(profileAccess({ isPrivate: false, isLocked: false })).toBe('anonymous');
  });

  it('should read a private profile the viewer may see with the token', () => {
    expect(profileAccess({ isPrivate: true, isLocked: false })).toBe('viewer');
  });

  it('should read nothing on a locked profile', () => {
    expect(profileAccess({ isPrivate: true, isLocked: true })).toBe('none');
  });
});
