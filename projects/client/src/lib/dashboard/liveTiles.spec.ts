import { describe, expect, it } from 'vitest';
import { liveTiles } from './liveTiles.ts';
import { socialFeedFixture } from './socialFeedFixture.ts';

const now = new Date('2026-10-05T16:30:00Z');
const live = socialFeedFixture.live(now);

describe('liveTiles', () => {
  it('should list who is watching, newest start first, with how far in they are', () => {
    const tiles = liveTiles(live.slice(0, 3), now);

    expect(tiles.map(({ watch }) => watch.member.name)).toEqual(['Damien', 'Kristin', 'Sefer']);
    expect(tiles.at(1)).toMatchObject({ progress: 85, minutesLeft: 4 });
  });

  it('should drop a watch past its expiry', () => {
    const later = new Date(now.getTime() + 5 * 60_000);

    expect(liveTiles(live.slice(0, 3), later).map(({ watch }) => watch.member.name)).toEqual(['Damien', 'Sefer']);
  });
});
