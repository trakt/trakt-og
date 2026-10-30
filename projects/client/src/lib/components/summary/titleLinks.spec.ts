import { describe, expect, it } from 'vitest';
import { toOverviewParts } from './titleLinks.ts';

describe('util: toOverviewParts', () => {
  it('should keep plain text as one part', () => {
    expect(toOverviewParts('Bryan Cranston is an actor.')).toEqual(['Bryan Cranston is an actor.']);
  });

  it('should turn title links into site links, without their italics', () => {
    expect(
      toOverviewParts(
        'Roles in [*Wicked*](https://app.trakt.tv/movies/wicked-2024) and [*Star Trek: Discovery*](https://app.trakt.tv/shows/star-trek-discovery).',
      ),
    ).toEqual([
      'Roles in ',
      { text: 'Wicked', href: '/movies/wicked-2024' },
      ' and ',
      { text: 'Star Trek: Discovery', href: '/shows/star-trek-discovery' },
      '.',
    ]);
  });

  it('should keep the stars in a title that holds them', () => {
    expect(toOverviewParts('[M*A*S*H](https://app.trakt.tv/shows/m-a-s-h) ran for years.')).toEqual([
      { text: 'M*A*S*H', href: '/shows/m-a-s-h' },
      ' ran for years.',
    ]);
  });

  it('should leave other links as typed', () => {
    const text = 'See [her site](https://example.com) and [*Wicked*](https://app.trakt.tv/people/someone).';
    expect(toOverviewParts(text)).toEqual([text]);
  });
});
