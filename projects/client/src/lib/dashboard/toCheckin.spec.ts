import { describe, expect, it } from 'vitest';
import { toCheckin } from './toCheckin.ts';

const play = {
  type: 'episode',
  runtime: 50,
  tags: [{ text: 'Season Premiere', kind: 'season-premiere' }, { text: 'Oct 14, 2026 4:56 PM' }],
  watchedAt: '2026-10-14T23:56:00.000Z',
} as const;

describe('toCheckin', () => {
  it('should swap the future date for a live tag and place now in the runtime', () => {
    expect(toCheckin(play, new Date('2026-10-14T23:16:00.000Z'))).toEqual({
      tags: [{ text: 'Checked in', kind: 'primary', live: true }, { text: 'Season Premiere', kind: 'season-premiere' }],
      progress: 20,
    });
  });

  it("should fall back to OG's runtime when the API has none", () => {
    expect(toCheckin({ ...play, type: 'movie', runtime: undefined }, new Date('2026-10-14T23:11:00.000Z'))?.progress)
      .toBe(50);
  });

  it('should be null once the watched time has passed', () => {
    expect(toCheckin(play, new Date('2026-10-14T23:56:00.000Z'))).toBeNull();
  });
});
