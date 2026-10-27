import { describe, expect, it } from 'vitest';
import { toPersonJsonLd } from './toPersonJsonLd.ts';

const person = {
  name: 'Adam Scott',
  href: '/people/adam-scott',
  biography: 'Known for [Parks and Recreation](https://trakt.tv/shows/parks-and-recreation).',
  headshot: 'https://media.trakt.tv/images/people/headshots/medium/a.jpg.webp',
  links: [
    { label: 'IMDB', href: 'https://www.imdb.com/name/nm0779084' },
    { label: 'TMDB', href: 'https://www.themoviedb.org/person/2' },
  ],
  facts: { birthday: '1973-04-03', death: undefined },
};

describe('seo: toPersonJsonLd', () => {
  it('should describe the person as a schema.org Person, links stripped from the biography', () => {
    expect(toPersonJsonLd(person)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Adam Scott',
      description: 'Known for Parks and Recreation.',
      url: 'https://og.trakt.tv/people/adam-scott',
      image: 'https://media.trakt.tv/images/people/headshots/medium/a.jpg',
      birthDate: '1973-04-03',
      sameAs: ['https://www.imdb.com/name/nm0779084', 'https://www.themoviedb.org/person/2'],
    });
  });

  it('should drop a missing biography, headshot and birthday', () => {
    expect(
      toPersonJsonLd({
        ...person,
        biography: null,
        headshot: undefined,
        links: [],
        facts: { birthday: undefined, death: undefined },
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Adam Scott',
      url: 'https://og.trakt.tv/people/adam-scott',
    });
  });
});
