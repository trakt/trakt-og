import { describe, expect, it } from 'vitest';
import { relatedPeopleNames } from './relatedPeopleNames.ts';

const people = (count: number) => Array.from({ length: count }, (_, id) => ({ id, name: `Person ${id + 1}` }));

describe('relatedPeopleNames', () => {
  it('should name one person alone', () => {
    expect(relatedPeopleNames(people(1))).toBe('Person 1');
  });

  it('should name up to ten people', () => {
    expect(relatedPeopleNames(people(10))).toBe(
      people(10)
        .map(({ name }) => name)
        .join(', '),
    );
  });

  it('should count the people past ten', () => {
    const names = relatedPeopleNames(people(13));
    expect(names.endsWith('Person 10 +3 more')).toBe(true);
    expect(names).not.toContain('Person 11');
  });
});
