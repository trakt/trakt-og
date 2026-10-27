import { describe, expect, it } from 'vitest';
import { toPersonSeo } from './toPersonSeo.ts';

const person = {
  name: 'Adam Scott',
  href: '/people/adam-scott',
  biography: 'Known for [Parks and Recreation](https://trakt.tv/shows/parks-and-recreation).',
  headshot: 'https://media.trakt.tv/images/people/headshots/medium/a.jpg.webp',
  links: [],
  facts: { birthday: '1973-04-03', death: undefined },
};

describe('seo: toPersonSeo', () => {
  it('should name the person and use their biography and headshot', () => {
    expect(toPersonSeo(person)).toMatchObject({
      title: 'Adam Scott',
      description: person.biography,
      image: person.headshot,
      imageAlt: 'Adam Scott',
      type: 'profile',
      jsonLd: [{ '@type': 'Person', name: 'Adam Scott', birthDate: '1973-04-03' }],
    });
  });

  it('should fall back to a fixed line and the default image', () => {
    const seo = toPersonSeo({ ...person, biography: null, headshot: undefined });

    expect(seo.description).toBe('Movies and shows with Adam Scott, on Trakt.');
    expect(seo.image).toBeUndefined();
  });
});
