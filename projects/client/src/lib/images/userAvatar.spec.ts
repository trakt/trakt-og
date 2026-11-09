import { describe, expect, it } from 'vitest';
import { userAvatar } from './userAvatar.ts';

describe('util: userAvatar', () => {
  it("should build a member's avatar from their Trakt id", () => {
    expect(userAvatar(1337)).toBe('https://media.trakt.tv/users/1337/avatar.webp');
  });
});
