import { describe, expect, it } from 'vitest';
import { toPersonSeo } from './toPersonSeo.ts';

const person = {
  name: 'Adam Scott',
  biography: 'Known for [Parks and Recreation](https://trakt.tv/shows/parks-and-recreation).',
  headshot: 'https://media.trakt.tv/images/people/headshots/medium/a.jpg.webp',
};

describe('seo: toPersonSeo', () => {
  it('should name the person and use their biography and headshot', () => {
    expect(toPersonSeo(person)).toEqual({
      title: 'Adam Scott',
      description: person.biography,
      image: person.headshot,
      imageAlt: 'Adam Scott',
      type: 'profile',
    });
  });

  it('should fall back to a fixed line and the default image', () => {
    const seo = toPersonSeo({ ...person, biography: null, headshot: undefined });

    expect(seo.description).toBe('Movies and shows with Adam Scott, on Trakt.');
    expect(seo.image).toBeUndefined();
  });
});
