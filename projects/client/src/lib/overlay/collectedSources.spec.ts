import { describe, expect, it } from 'vitest';
import { collectedSources } from './collectedSources.ts';

describe('util: collectedSources', () => {
  it('should merge every episode source once', () => {
    expect(collectedSources([['plex'], [], ['jellyfin', 'plex']])).toEqual(['plex', 'jellyfin']);
  });

  it('should be undefined when nothing was synced', () => {
    expect(collectedSources([[], []])).toBeUndefined();
  });
});
