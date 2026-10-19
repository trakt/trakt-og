import type { PeopleResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { toRelatedPeople } from './toRelatedPeople.ts';

const person = (id: number, name: string) => ({ ids: { trakt: id, slug: `p${id}` }, name });

describe('toRelatedPeople', () => {
  it('should keep the billed cast, then the key crew, once each', () => {
    const people = {
      cast: [{ person: person(1, 'Bob Odenkirk'), characters: ['Saul Goodman'] }],
      crew: {
        writing: [
          { person: person(2, 'Vince Gilligan'), job: 'Creator', jobs: ['Creator', 'Writer'] },
          { person: person(1, 'Bob Odenkirk'), job: 'Writer', jobs: ['Writer'] },
        ],
        production: [{
          person: person(3, 'An Accountant'),
          job: 'Production Accountant',
          jobs: ['Production Accountant'],
        }],
      },
    } as unknown as PeopleResponse;
    expect(toRelatedPeople(people)).toEqual([{ id: 1, name: 'Bob Odenkirk' }, { id: 2, name: 'Vince Gilligan' }]);
  });

  it('should stop the cast at the first 25 billed', () => {
    const cast = Array.from({ length: 30 }, (_, i) => ({ person: person(i + 1, `Actor ${i + 1}`), characters: [] }));
    const result = toRelatedPeople({ cast } as unknown as PeopleResponse);
    expect(result).toHaveLength(25);
    expect(result.at(-1)).toEqual({ id: 25, name: 'Actor 25' });
  });

  it('should have no one without people', () => {
    expect(toRelatedPeople(null)).toEqual([]);
  });
});
