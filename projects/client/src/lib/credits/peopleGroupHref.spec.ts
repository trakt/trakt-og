import { describe, expect, it } from 'vitest';
import { peopleGroupHref } from './peopleGroupHref.ts';
import { readPeopleGroup } from './readPeopleGroup.ts';

const href = '/shows/breaking-bad/people';

describe('peopleGroupHref', () => {
  it('should leave the first group bare', () => {
    expect(peopleGroupHref(href, { kind: 'Actors', id: 'season-regulars', first: true })).toBe(href);
  });

  it('should name any other group by kind', () => {
    expect(peopleGroupHref(href, { kind: 'Actors', id: 'guest-stars', first: false })).toBe(
      `${href}?actors=guest-stars`,
    );
    expect(peopleGroupHref(href, { kind: 'Crew', id: 'costume-make-up', first: false })).toBe(
      `${href}?crew=costume-make-up`,
    );
  });

  it('should read back as the page key', () => {
    const link = peopleGroupHref(href, { kind: 'Crew', id: 'production', first: false });

    expect(readPeopleGroup(new URL(link, 'https://trakt.tv').searchParams)).toBe('Crew:production');
  });
});
