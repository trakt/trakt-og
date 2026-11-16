import { describe, expect, it } from 'vitest';
import { releaseCertifications } from './releaseCertifications.ts';

describe('releaseCertifications', () => {
  it("should take each country's theatrical rating, else its first rated release, and skip unrated countries", () => {
    expect(
      releaseCertifications([
        { country: 'us', certification: 'PG-13', release_type: 'premiere' },
        { country: 'us', certification: 'R', release_type: 'theatrical' },
        { country: 'de', certification: '', release_type: 'theatrical' },
        { country: 'de', certification: '12', release_type: 'digital' },
        { country: 'fr', certification: null, release_type: 'theatrical' },
      ]),
    ).toEqual([
      { country: 'us', certification: 'R' },
      { country: 'de', certification: '12' },
    ]);
  });
});
