import { describe, expect, it } from 'vitest';
import { commitTypeTile } from './commitTypeTile.ts';

describe('commitTypeTile', () => {
  it('should give each commitlint type its own label and color', () => {
    expect(commitTypeTile('feat')).toMatchObject({ label: 'New', color: 'var(--brand-primary)' });
    expect(commitTypeTile('fix')).toMatchObject({ label: 'Fixed', color: 'var(--brand-seventh)' });
    expect(commitTypeTile('docs').label).toBe('Docs');
  });

  it('should fall back to a plain change for anything else', () => {
    expect(commitTypeTile(null).label).toBe('Change');
    expect(commitTypeTile('wip').label).toBe('Change');
  });
});
