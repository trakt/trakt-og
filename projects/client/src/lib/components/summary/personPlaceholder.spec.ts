import { describe, expect, it } from 'vitest';
import { personPlaceholder } from './personPlaceholder.ts';

describe('personPlaceholder', () => {
  it('should pick Leela for women and Fry for men', () => {
    expect(personPlaceholder('female')).toContain('person-leela');
    expect(personPlaceholder('male')).toContain('person-fry');
  });

  it('should pick Zoidberg for anyone else or unknown', () => {
    for (const gender of ['non_binary', 'unknown', null, undefined]) {
      expect(personPlaceholder(gender)).toContain('person-zoidberg');
    }
  });
});
