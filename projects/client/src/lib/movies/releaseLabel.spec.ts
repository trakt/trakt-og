import { describe, expect, it } from 'vitest';
import { releaseLabel } from './releaseLabel.ts';
import type { ReleaseDate } from './toMovieReleases.ts';

const release = (limited: boolean) => ({ type: 'Theatrical', limited, dateText: 'Jul 29, 2026' }) as ReleaseDate;

describe('releaseLabel', () => {
  it('should name the type and date, marking a limited run', () => {
    expect(releaseLabel(release(false))).toBe('Theatrical, Jul 29, 2026');
    expect(releaseLabel(release(true))).toBe('Theatrical (limited), Jul 29, 2026');
  });
});
