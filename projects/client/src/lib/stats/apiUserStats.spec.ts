import { describe, expect, it } from 'vitest';
import { dashboardFrameFixture } from '../dashboard/dashboardFrameFixture.ts';
import { apiUserStats } from './apiUserStats.ts';

const body = dashboardFrameFixture.newStats;
const zeros = {
  movies: { plays: 0, watched: 0, minutes: 0, collected: 0, ratings: 0, comments: 0 },
  shows: { watched: 0, collected: 0, ratings: 0, comments: 0 },
  seasons: { ratings: 0, comments: 0 },
  episodes: { plays: 0, watched: 0, minutes: 0, collected: 0, ratings: 0, comments: 0 },
  network: { friends: 0, followers: 0, following: 0 },
  ratings: { total: 0, distribution: {} },
};

describe('apiUserStats', () => {
  it('should keep the stats the API sent', () => {
    expect(apiUserStats({ status: 200, body })?.episodes.watched).toBe(4);
  });

  it('should keep stats with only a follower above zero', () => {
    const network = { friends: 0, followers: 1, following: 0 };

    expect(apiUserStats({ status: 200, body: { ...zeros, network } })).not.toBeNull();
  });

  it.each([
    ['no response', null],
    ['an empty 204', { status: 204, body: undefined }],
    ['a 404', { status: 404, body: 'Not Found' }],
    ['a body that does not parse', { status: 200, body: { movies: {} } }],
    ['all zeros', { status: 200, body: zeros }],
  ])('should give null for %s', (_, response) => {
    expect(apiUserStats(response)).toBeNull();
  });
});
