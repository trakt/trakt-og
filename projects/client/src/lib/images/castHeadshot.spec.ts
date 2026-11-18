import { describe, expect, it } from 'vitest';
import { castHeadshot } from './castHeadshot.ts';
import { fallbackArt } from './fallbackArt.ts';

const headshot = 'https://media.trakt.tv/people/17419/thumb/headshot.webp';

describe('util: castHeadshot', () => {
  it("should use the actor's portrait on a show, falling back to their headshot", () => {
    const src = castHeadshot(17419, { media: 'show', id: 1388 });

    expect(src.split('#')[0]).toBe('https://media.trakt.tv/portraits/show-1388-17419/thumb/portrait.webp');
    expect(fallbackArt(src)).toBe(headshot);
  });

  it("should use the actor's portrait on a movie", () => {
    expect(castHeadshot(17419, { media: 'movie', id: 120 }).split('#')[0]).toBe(
      'https://media.trakt.tv/portraits/movie-120-17419/thumb/portrait.webp',
    );
  });

  it('should use the headshot without portraits', () => {
    expect(castHeadshot(17419)).toBe(headshot);
  });
});
