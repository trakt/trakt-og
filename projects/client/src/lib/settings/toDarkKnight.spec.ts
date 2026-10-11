import { describe, expect, it } from 'vitest';
import { toDarkKnight } from './toDarkKnight.ts';

describe('toDarkKnight', () => {
  it('should read Off, On and Auto as API sends them', () => {
    expect(toDarkKnight({ browsing: { dark_knight: 'false' } })).toBe('false');
    expect(toDarkKnight({ browsing: { dark_knight: 'true' } })).toBe('true');
    expect(toDarkKnight({ browsing: { dark_knight: 'auto' } })).toBe('auto');
  });

  it('should read an unset or unknown value as On, the default', () => {
    expect(toDarkKnight({ browsing: { dark_knight: '' } })).toBe('true');
    expect(toDarkKnight({ browsing: { dark_knight: true } })).toBe('true');
    expect(toDarkKnight({ browsing: {} })).toBe('true');
    expect(toDarkKnight({ browsing: null })).toBe('true');
  });

  it('should be On when signed out', () => {
    expect(toDarkKnight(null)).toBe('true');
  });
});
