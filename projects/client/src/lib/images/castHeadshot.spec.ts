import { describe, expect, it } from 'vitest';
import { castHeadshot } from './castHeadshot.ts';
import { fallbackArt } from './fallbackArt.ts';

const person = { ids: { trakt: 17419 } };
const headshot = 'https://media.trakt.tv/people/17419/thumb/headshot.webp';

describe('util: castHeadshot', () => {
  it('should use the character thumb, falling back to the headshot', () => {
    const src = castHeadshot({
      person,
      character_image: 'media.trakt.tv/characters/1388-17419/medium/headshot.webp',
    });

    expect(src.split('#')[0]).toBe('https://media.trakt.tv/characters/1388-17419/thumb/headshot.webp');
    expect(fallbackArt(src)).toBe(headshot);
  });

  it('should use the headshot when there is no character image', () => {
    expect(castHeadshot({ person, character_image: null })).toBe(headshot);
    expect(castHeadshot({ person })).toBe(headshot);
  });

  it('should use the headshot for a blank character image', () => {
    expect(castHeadshot({ person, character_image: ' ' })).toBe(headshot);
  });
});
