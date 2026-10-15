import { describe, expect, it } from 'vitest';
import { readPeopleGroup } from './readPeopleGroup.ts';

describe('readPeopleGroup', () => {
  it('should read the crew or actors group', () => {
    expect(readPeopleGroup(new URLSearchParams('crew=sound'))).toBe('Crew:sound');
    expect(readPeopleGroup(new URLSearchParams('actors=guest-stars'))).toBe('Actors:guest-stars');
  });

  it('should ask for nothing without either', () => {
    expect(readPeopleGroup(new URLSearchParams('sort=name'))).toBeUndefined();
    expect(readPeopleGroup(new URLSearchParams('crew='))).toBeUndefined();
  });
});
