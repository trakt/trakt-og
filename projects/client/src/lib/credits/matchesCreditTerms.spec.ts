import { describe, expect, it } from 'vitest';
import { matchesCreditTerms } from './matchesCreditTerms.ts';

const walt = { name: 'Bryan Cranston', role: 'Walter White' };

describe('matchesCreditTerms', () => {
  it('should match everyone without terms', () => {
    expect(matchesCreditTerms(walt, '  ')).toBe(true);
  });

  it('should match the name or the role, ignoring case', () => {
    expect(matchesCreditTerms(walt, 'cranston')).toBe(true);
    expect(matchesCreditTerms(walt, 'WALTER')).toBe(true);
    expect(matchesCreditTerms(walt, 'pinkman')).toBe(false);
  });

  it('should ignore accents on either side', () => {
    expect(matchesCreditTerms({ name: 'Thomas Golubić', role: 'Music Supervisor' }, 'golubic')).toBe(true);
    expect(matchesCreditTerms({ name: 'Tio Salamanca', role: '' }, 'tío')).toBe(true);
  });
});
