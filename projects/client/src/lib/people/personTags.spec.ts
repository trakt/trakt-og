import { describe, expect, it } from 'vitest';
import { personTags } from './personTags.ts';

describe('util: personTags', () => {
  it('should tag the age as of today and what they are known for', () => {
    expect(personTags({ birthday: '1968-10-12', known_for_department: 'acting' }, { today: '2026-10-10' })).toEqual([
      'Age 57',
      'Acting',
    ]);
    expect(personTags({ birthday: '1968-10-10', known_for_department: 'directing' }, { today: '2026-10-10' })).toEqual([
      'Age 58',
      'Directing',
    ]);
  });

  it('should tag the date of death instead of an age, in the viewer order', () => {
    const herbert = { birthday: '1884-08-10', death: '1952-03-12', known_for_department: 'acting' };

    expect(personTags(herbert, { today: '2026-10-10' })).toEqual(['Died Mar 12, 1952', 'Acting']);
    expect(personTags(herbert, { today: '2026-10-10', order: 'dmy' })).toEqual(['Died 12 Mar 1952', 'Acting']);
  });

  it('should leave out what it does not know', () => {
    expect(personTags({ birthday: '1968-10-12' })).toEqual([]);
    expect(personTags({ known_for_department: 'sound' }, { today: '2026-10-10' })).toEqual(['Sound']);
  });
});
