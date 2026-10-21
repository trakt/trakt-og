import { describe, expect, it } from 'vitest';
import { toBirthday } from './toBirthday.ts';

describe('toBirthday', () => {
  it('should celebrate on the day, with the age turned', () => {
    expect(toBirthday({ birthday: '1956-03-07', today: '2026-03-07' })).toEqual({ age: 70 });
  });

  it('should not celebrate on any other day', () => {
    expect(toBirthday({ birthday: '1956-03-07', today: '2026-03-08' })).toBeUndefined();
  });

  it('should not celebrate someone who has died', () => {
    expect(toBirthday({ birthday: '1930-05-31', death: '2000-05-30', today: '2026-05-31' })).toBeUndefined();
  });

  it('should not celebrate without a birthday', () => {
    expect(toBirthday({ birthday: null, today: '2026-03-07' })).toBeUndefined();
  });

  describe('for a February 29 birthday', () => {
    it('should celebrate on February 28 in other years', () => {
      expect(toBirthday({ birthday: '1996-02-29', today: '2026-02-28' })).toEqual({ age: 30 });
    });

    it('should celebrate on February 29 in a leap year', () => {
      expect(toBirthday({ birthday: '1996-02-29', today: '2028-02-29' })).toEqual({ age: 32 });
      expect(toBirthday({ birthday: '1996-02-29', today: '2028-02-28' })).toBeUndefined();
    });
  });
});
