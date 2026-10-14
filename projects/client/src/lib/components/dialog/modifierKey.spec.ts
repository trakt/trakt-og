import { describe, expect, it } from 'vitest';
import { modifierKey } from './modifierKey.ts';

describe('util: modifierKey', () => {
  it('should be the command key on Apple platforms', () => {
    expect(modifierKey('MacIntel')).toBe('⌘');
    expect(modifierKey('iPad')).toBe('⌘');
  });

  it('should be Ctrl elsewhere', () => {
    expect(modifierKey('Win32')).toBe('Ctrl');
    expect(modifierKey('Linux x86_64')).toBe('Ctrl');
    expect(modifierKey('')).toBe('Ctrl');
  });
});
