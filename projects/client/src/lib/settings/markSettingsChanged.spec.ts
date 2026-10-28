import { describe, expect, it } from 'vitest';
import { markSettingsChanged } from './markSettingsChanged.ts';

describe('markSettingsChanged', () => {
  it('should write a new revision cookie for the whole site', () => {
    const page = { cookie: '' };

    markSettingsChanged(page, 1_000_000);
    const first = page.cookie;
    markSettingsChanged(page, 1_000_001);

    expect(first).toBe('og-settings=lfls; path=/; samesite=lax; max-age=86400');
    expect(page.cookie).not.toBe(first);
  });
});
