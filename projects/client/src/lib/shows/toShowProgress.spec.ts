import type { EpisodeResponse, ShowResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import type { SeasonWithEpisodes } from './loadShow.ts';
import { toShowProgress } from './toShowProgress.ts';
import { toShowSummary } from './toShowSummary.ts';

const episode = (season: number, number: number, firstAired: string | null, trakt = season * 100 + number) =>
  ({ season, number, title: `E${number}`, first_aired: firstAired, ids: { trakt } }) as EpisodeResponse;

const season = (number: number, episodes: EpisodeResponse[]) =>
  ({ number, ids: { trakt: 900 + number }, episode_count: episodes.length, episodes }) as SeasonWithEpisodes;

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const now = new Date('2026-09-29T12:00:00Z');
const seasons = [
  season(1, [
    episode(1, 1, '2026-09-01T00:00:00Z'),
    episode(1, 2, '2026-09-08T00:00:00Z'),
    episode(1, 3, '2026-09-15T00:00:00Z'),
    episode(1, 4, '2026-09-22T00:00:00Z'),
    episode(1, 5, '2026-10-06T00:00:00Z'),
  ]),
];

const summary = (list: SeasonWithEpisodes[] = seasons) =>
  toShowSummary({
    show: {
      title: 'Breaking Bad',
      ids: { slug: 'breaking-bad', trakt: 1388 },
      genres: ['drama'],
      network: 'AMC',
    } as ShowResponse,
    ratings: null,
    stats: null,
    people: null,
    studios: [],
    seasons: list,
    signedIn: true,
    rank: null,
    otherSiteRatings: true,
    actorSpoilers: true,
    episodeTypeTags: true,
    datePreferences,
    now,
  });

const progressOf = (progress: Parameters<typeof toShowProgress>[0]['progress'], list?: SeasonWithEpisodes[]) => {
  const { progressBase } = summary(list);
  if (!progressBase) throw new Error('signed in');
  return toShowProgress({ base: progressBase, progress, datePreferences, now });
};

describe('toShowProgress', () => {
  it('should put the next to watch first and leave it out of Recently Aired', () => {
    const { recent } = progressOf({ next_episode: episode(1, 3, '2026-09-15T00:00:00Z') });

    expect(recent.upNext).toBe(true);
    expect(recent.next?.number).toBe('1x03');
    expect(recent.aired.map(({ number }) => number)).toEqual(['1x04', '1x02']);
  });

  it('should build the next to watch even when it is not among the latest aired', () => {
    const { recent } = progressOf({ next_episode: episode(1, 1, '2026-09-01T00:00:00Z') });

    expect(recent.next?.number).toBe('1x01');
    expect(recent.aired.map(({ number }) => number)).toEqual(['1x04', '1x03']);
  });

  it('should fall back to the next to air when the viewer is caught up', () => {
    const { recent } = progressOf({ next_episode: null });

    expect(recent.upNext).toBe(true);
    expect(recent.next?.number).toBe('1x05');
    expect(recent.aired.map(({ number }) => number)).toEqual(['1x04', '1x03']);
  });

  it('should show three aired episodes when caught up with nothing to air', () => {
    const { recent } = progressOf({ next_episode: null }, [season(1, seasons[0]!.episodes!.slice(0, 4))]);

    expect(recent.next).toBeUndefined();
    expect(recent.aired).toHaveLength(3);
  });

  it('should skip a next episode without an air date or in the specials', () => {
    expect(progressOf({ next_episode: episode(1, 6, null) }).recent.next?.number).toBe('1x05');
    expect(progressOf({ next_episode: episode(0, 1, '2026-09-01T00:00:00Z') }).recent.next?.number).toBe('1x05');
  });

  it('should check in to the next episode to watch once it has aired', () => {
    const checkin = (firstAired: string | null) =>
      progressOf({ next_episode: episode(2, 5, firstAired), last_episode: null }).checkin;

    expect(checkin('2026-09-01T01:00:00Z')).toEqual({ type: 'episode', id: 205 });
    expect(checkin('2026-10-01T01:00:00Z')).toBeUndefined();
    expect(checkin(null)).toBeUndefined();
    expect(progressOf({ next_episode: null }).checkin).toBeUndefined();
  });

  it('should name the last episode watched for the dropped stamp', () => {
    expect(progressOf({ next_episode: null, last_episode: episode(3, 2, null) }).lastSeen).toBe('3x02');
    expect(progressOf({ next_episode: episode(1, 1, null), last_episode: null }).lastSeen).toBeUndefined();
  });
});
