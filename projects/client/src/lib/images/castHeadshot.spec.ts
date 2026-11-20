import { describe, expect, it } from 'vitest';
import { castHeadshot } from './castHeadshot.ts';
import { fallbackArt } from './fallbackArt.ts';

const headshot = 'https://media.trakt.tv/people/17419/thumb/headshot.webp';
const token = '1794787200-mac';

describe('util: castHeadshot', () => {
  it("should use the actor's signed portrait on a show, falling back to their headshot", () => {
    const src = castHeadshot(17419, { media: 'show', id: 1388, token });

    expect(src.split('#')[0]).toBe(
      'https://media.trakt.tv/portraits/show-1388-17419/thumb/portrait.webp?verify=1794787200-mac',
    );
    expect(fallbackArt(src)).toBe(headshot);
  });

  it("should use the actor's signed portrait on a movie", () => {
    expect(castHeadshot(17419, { media: 'movie', id: 120, token }).split('#')[0]).toBe(
      'https://media.trakt.tv/portraits/movie-120-17419/thumb/portrait.webp?verify=1794787200-mac',
    );
  });

  it("should try the season's portrait, then the show's, then the headshot", () => {
    const src = castHeadshot(17419, { media: 'show', id: 1388, season: 2, token });
    const show = fallbackArt(src) ?? '';

    expect(src.split('#')[0]).toBe(
      'https://media.trakt.tv/portraits/show-1388-s2-17419/thumb/portrait.webp?verify=1794787200-mac',
    );
    expect(show.split('#')[0]).toBe(
      'https://media.trakt.tv/portraits/show-1388-17419/thumb/portrait.webp?verify=1794787200-mac',
    );
    expect(fallbackArt(show)).toBe(headshot);
  });

  it('should use the season form for specials', () => {
    expect(castHeadshot(17419, { media: 'show', id: 1388, season: 0, token }).split('#')[0]).toBe(
      'https://media.trakt.tv/portraits/show-1388-s0-17419/thumb/portrait.webp?verify=1794787200-mac',
    );
  });

  it('should use the headshot without portraits', () => {
    expect(castHeadshot(17419)).toBe(headshot);
  });
});
