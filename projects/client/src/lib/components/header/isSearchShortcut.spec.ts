import { describe, expect, it } from 'vitest';
import { isSearchShortcut } from './isSearchShortcut.ts';

const press = { key: '/', ctrlKey: false, metaKey: false, altKey: false, defaultPrevented: false, editing: false };

describe('util: isSearchShortcut', () => {
  it('should take a bare slash outside a text field', () => {
    expect(isSearchShortcut(press)).toBe(true);
  });

  it('should ignore other keys', () => {
    expect(isSearchShortcut({ ...press, key: 's' })).toBe(false);
  });

  it('should leave a slash typed into a text field alone', () => {
    expect(isSearchShortcut({ ...press, editing: true })).toBe(false);
  });

  it('should leave modified slashes to the browser', () => {
    expect(isSearchShortcut({ ...press, ctrlKey: true })).toBe(false);
    expect(isSearchShortcut({ ...press, metaKey: true })).toBe(false);
    expect(isSearchShortcut({ ...press, altKey: true })).toBe(false);
  });

  it('should skip a slash another handler already took', () => {
    expect(isSearchShortcut({ ...press, defaultPrevented: true })).toBe(false);
  });
});
