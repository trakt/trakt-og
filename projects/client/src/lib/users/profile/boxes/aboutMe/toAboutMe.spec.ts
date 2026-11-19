import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { toAboutMe } from './toAboutMe.ts';

const { dex, maya } = boxPersonas;

describe('toAboutMe', () => {
  it('should keep the words when the owner wrote some', () => {
    expect(toAboutMe(dex.input)).toEqual({
      label: 'About Dex',
      kind: 'filled',
      about: expect.stringContaining('Letterboxd refugee'),
    });
  });

  it('should prompt you to write yours on your own empty profile, in the settings on v3 web', () => {
    expect(toAboutMe({ ...maya.input, isSelf: true })).toEqual({
      label: 'About Me',
      kind: 'self',
      settingsHref: 'https://app.trakt.tv/settings',
    });
  });

  it("should have none on someone else's empty profile", () => {
    expect(toAboutMe(maya.input)).toBeNull();
  });
});
