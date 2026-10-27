import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { GET } from './+server.ts';

const locationFor = (token: string | null, start?: string, search = '') => {
  try {
    GET({
      locals: { token },
      params: { start },
      url: new URL(`https://og.trakt.tv/calendars/shows${search}`),
    } as Parameters<typeof GET>[0]);
  } catch (thrown) {
    if (isRedirect(thrown)) return thrown.location;
    throw thrown;
  }
  return null;
};

describe('route: /calendars/shows', () => {
  it('should open My Shows signed in, keeping the start and filters', () => {
    expect(locationFor('fake-token', '2026-10-01', '?genres=drama')).toBe(
      '/calendars/my/shows/2026-10-01?genres=drama',
    );
  });

  it('should open All Premieres signed out', () => {
    expect(locationFor(null)).toBe('/calendars/premieres');
  });
});
