import { describe, expect, it } from 'vitest';
import { toPersonSeo } from './toPersonSeo.ts';

const person = {
  name: 'Adam Scott',
  href: '/people/adam-scott',
  biography: 'Known for [Parks and Recreation](https://trakt.tv/shows/parks-and-recreation).',
  preview: 'https://og.trakt.tv/api/art/person/5/headshot',
  links: [],
  facts: { birthday: '1973-04-03', death: undefined },
};

describe('seo: toPersonSeo', () => {
  it('should name the person and use their biography and headshot', () => {
    expect(toPersonSeo(person)).toMatchObject({
      title: 'Adam Scott',
      description: person.biography,
      image: person.preview,
      imageAlt: 'Adam Scott',
      type: 'profile',
      jsonLd: [{ '@type': 'Person', name: 'Adam Scott', birthDate: '1973-04-03' }],
    });
  });

  it('should fall back to a fixed line without a biography', () => {
    const seo = toPersonSeo({ ...person, biography: null });

    expect(seo.description).toBe('Movies and shows with Adam Scott, on Trakt.');
  });
});
