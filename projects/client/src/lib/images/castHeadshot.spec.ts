import { describe, expect, it } from 'vitest';
import { castHeadshot } from './castHeadshot.ts';
import { fallbackArt } from './fallbackArt.ts';

const headshot = 'https://media.trakt.tv/people/17419/thumb/headshot.webp';

describe('util: castHeadshot', () => {
  it("should use the actor's character thumb on a show, falling back to their headshot", () => {
    const src = castHeadshot(17419, 1388);

    expect(src.split('#')[0]).toBe('https://media.trakt.tv/characters/1388-17419/thumb/headshot.webp');
    expect(fallbackArt(src)).toBe(headshot);
  });

  it('should use the headshot without a show', () => {
    expect(castHeadshot(17419)).toBe(headshot);
  });
});
